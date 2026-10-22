import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { FolkMappingStatus, type Prisma } from '@repo/db';
import type {
	FolkCustomerOption,
	FolkMappingSummaryType,
	GetFolkMappingsResponseType,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import type { FolkMappingQueryDto } from '../dto/mapping-query.dto';
import { FolkApiClient, type FolkCompany } from '../folk.client';
import { FOLK_FIELDS } from '../utils/folk-fields';
import { FolkInteractionsService } from './folk-interactions.service';

const MAPPING_INCLUDE = {
	customers: { select: { id: true, displayName: true, saueroCode: true } },
	proposedCustomer: {
		select: { id: true, displayName: true, saueroCode: true },
	},
} satisfies Prisma.FolkCompanyMappingInclude;

const MIN_CUSTOMER_SEARCH_CHARS = 3;

@Injectable()
export class FolkMappingService {
	private readonly logger = new Logger(FolkMappingService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient,
		private readonly interactionsService: FolkInteractionsService
	) {}

	async list(
		filter: FolkMappingQueryDto
	): Promise<GetFolkMappingsResponseType> {
		const page = filter.page ?? 1;
		const limit = filter.limit ?? 20;
		const where: Prisma.FolkCompanyMappingWhereInput = {};

		if (filter.status) {
			where.status = filter.status;
		}
		if (filter.search) {
			const term = filter.search.trim();
			where.OR = [
				{ folkCompanyName: { contains: term, mode: 'insensitive' } },
				{ sdCustomerId: { contains: term, mode: 'insensitive' } },
			];
		}

		// Tiered order (mapped, then proposed, then the rest, each by name) isn't
		// expressible in Prisma's orderBy, and the table is bounded by the size of
		// the Folk groups, so it is sorted and paged in memory.
		const mappings = await this.prisma.folkCompanyMapping.findMany({
			where,
			include: MAPPING_INCLUDE,
		});

		const tier = (mapping: (typeof mappings)[number]) =>
			mapping.status === FolkMappingStatus.MAPPED
				? 0
				: mapping.proposedCustomerId
					? 1
					: 2;

		mappings.sort(
			(a, b) =>
				tier(a) - tier(b) || a.folkCompanyName.localeCompare(b.folkCompanyName)
		);

		const start = (page - 1) * limit;
		return {
			data: mappings.slice(start, start + limit),
			totalCount: mappings.length,
			page,
			limit,
		};
	}

	async summary(): Promise<FolkMappingSummaryType> {
		const grouped = await this.prisma.folkCompanyMapping.groupBy({
			by: ['status'],
			_count: { _all: true },
		});
		const counts: Record<FolkMappingStatus, number> = {
			PENDING_REVIEW: 0,
			MAPPED: 0,
			UNMAPPED: 0,
		};
		let total = 0;
		for (const row of grouped) {
			counts[row.status] = row._count._all;
			total += row._count._all;
		}
		return { ...counts, total };
	}

	async searchCustomers(
		search: string,
		excludeMappingId?: string
	): Promise<FolkCustomerOption[]> {
		const term = search.trim();
		if (term.length < MIN_CUSTOMER_SEARCH_CHARS) return [];

		return this.prisma.shopifyCustomer.findMany({
			where: {
				...(excludeMappingId
					? {
							OR: [
								{ folkCompanyMappingId: null },
								{ folkCompanyMappingId: { not: excludeMappingId } },
							],
						}
					: {}),
				AND: [
					{
						OR: [
							{ displayName: { contains: term, mode: 'insensitive' } },
							{ email: { contains: term, mode: 'insensitive' } },
							{ firstName: { contains: term, mode: 'insensitive' } },
							{ lastName: { contains: term, mode: 'insensitive' } },
							{ saueroCode: { contains: term, mode: 'insensitive' } },
						],
					},
				],
			},
			select: { id: true, displayName: true, email: true },
			take: 25,
			orderBy: { displayName: 'asc' },
		});
	}

	async linkCustomer(mappingId: string, customerId: string) {
		const mapping = await this.prisma.folkCompanyMapping.findUnique({
			where: { id: mappingId },
		});
		if (!mapping) {
			throw new NotFoundException(`Folk mapping "${mappingId}" not found`);
		}

		const customer = await this.prisma.shopifyCustomer.findUnique({
			where: { id: customerId },
		});
		if (!customer) {
			throw new NotFoundException(`Customer "${customerId}" not found`);
		}

		await this.prisma.shopifyCustomer.update({
			where: { id: customerId },
			data: { folkCompanyMappingId: mappingId },
		});

		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				status: FolkMappingStatus.MAPPED,
				proposedCustomerId: null,
				rejectedCustomerId: null,
			},
		});

		try {
			const company = await this.folkClient.getCompany(mapping.folkCompanyId);
			await this.applyRelationshipFields(
				mappingId,
				company,
				mapping.folkGroupId
			);
		} catch (err) {
			this.logger.warn(
				`Linked mapping ${mappingId} but could not refresh Folk fields: ${(err as Error).message}`
			);
		}

		// Filled here too, so a new mapping shows last contact alongside status
		// and customer type instead of waiting for the nightly reconcile
		try {
			await this.interactionsService.syncLastContact(
				mappingId,
				mapping.folkCompanyId
			);
		} catch (err) {
			this.logger.warn(
				`Linked mapping ${mappingId} but could not sync last contact: ${(err as Error).message}`
			);
		}

		return { message: 'Customer linked to mapping' };
	}

	async unlinkCustomer(mappingId: string, customerId: string) {
		const mapping = await this.prisma.folkCompanyMapping.findUnique({
			where: { id: mappingId },
			include: { customers: { select: { id: true } } },
		});
		if (!mapping) {
			throw new NotFoundException(`Folk mapping "${mappingId}" not found`);
		}

		const linked = mapping.customers.some(
			(customer) => customer.id === customerId
		);
		if (!linked) {
			throw new BadRequestException(
				`Customer "${customerId}" is not linked to this mapping`
			);
		}

		await this.prisma.shopifyCustomer.update({
			where: { id: customerId },
			data: { folkCompanyMappingId: null },
		});

		const remaining = mapping.customers.length - 1;
		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				status:
					remaining > 0 ? FolkMappingStatus.MAPPED : FolkMappingStatus.UNMAPPED,
				proposedCustomerId: null,
				matchScore: remaining > 0 ? mapping.matchScore : null,
				...(remaining > 0
					? {}
					: {
							pipelineStatus: null,
							customerType: null,
							lastContactAt: null,
							lastContactType: null,
						}),
			},
		});

		return { message: 'Customer unlinked from mapping' };
	}

	async denyProposal(mappingId: string) {
		const mapping = await this.prisma.folkCompanyMapping.findUnique({
			where: { id: mappingId },
		});
		if (!mapping) {
			throw new NotFoundException(`Folk mapping "${mappingId}" not found`);
		}
		if (
			mapping.status !== FolkMappingStatus.PENDING_REVIEW ||
			!mapping.proposedCustomerId
		) {
			throw new BadRequestException('This mapping has no proposal to deny');
		}

		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				status: FolkMappingStatus.UNMAPPED,
				rejectedCustomerId: mapping.proposedCustomerId,
				proposedCustomerId: null,
				matchScore: null,
			},
		});

		return { message: 'Proposal denied' };
	}

	async markUnmapped(mappingId: string) {
		const mapping = await this.prisma.folkCompanyMapping.findUnique({
			where: { id: mappingId },
			include: { customers: { select: { id: true } } },
		});
		if (!mapping) {
			throw new NotFoundException(`Folk mapping "${mappingId}" not found`);
		}

		if (mapping.customers.length > 0) {
			await this.prisma.shopifyCustomer.updateMany({
				where: { folkCompanyMappingId: mappingId },
				data: { folkCompanyMappingId: null },
			});
		}

		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				status: FolkMappingStatus.UNMAPPED,
				proposedCustomerId: null,
				matchScore: null,
				pipelineStatus: null,
				customerType: null,
				lastContactAt: null,
				lastContactType: null,
			},
		});

		return { message: 'Mapping marked as unmapped' };
	}

	async applyRelationshipFields(
		mappingId: string,
		company: FolkCompany,
		groupId: string
	): Promise<void> {
		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				pipelineStatus: this.folkClient.readTextField(
					company,
					groupId,
					FOLK_FIELDS.status
				),
				customerType: this.folkClient.readTextField(
					company,
					groupId,
					FOLK_FIELDS.accountType
				),
			},
		});
	}
}
