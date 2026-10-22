import { Injectable, Logger } from '@nestjs/common';
import { FolkMappingStatus } from '@repo/db';
import type { FolkSeedResultType } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient } from '../folk.client';
import {
	type MatchCandidate,
	type ProposedMatch,
	proposeCustomer,
} from '../utils/folk-match';
import { FolkGroupsService } from './folk-groups.service';
import { FolkMappingService } from './folk-mapping.service';

function proposalFields(
	match: ProposedMatch | null,
	rejectedCustomerId: string | null
) {
	const proposal =
		match && match.customerId !== rejectedCustomerId ? match : null;
	return {
		status: proposal
			? FolkMappingStatus.PENDING_REVIEW
			: FolkMappingStatus.UNMAPPED,
		matchScore: proposal?.score ?? null,
		proposedCustomerId: proposal?.customerId ?? null,
	};
}

@Injectable()
export class FolkSeedService {
	private readonly logger = new Logger(FolkSeedService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient,
		private readonly mappingService: FolkMappingService,
		private readonly groupsService: FolkGroupsService
	) {}

	async seed(): Promise<FolkSeedResultType> {
		// Keep group names in step with Folk before anything reads them.
		await this.groupsService.syncNames();
		const groupIds = await this.groupsService.getTrackedGroupIds();
		const candidates = await this.loadMatchCandidates();
		const seenFolkIds = new Set<string>();

		let upserted = 0;
		let proposed = 0;

		for (const groupId of groupIds) {
			const result = await this.seedGroup(groupId, candidates, seenFolkIds);
			upserted += result.upserted;
			proposed += result.proposed;
		}

		const deleted = await this.pruneMissingCompanies(groupIds, seenFolkIds);

		this.logger.log(
			`Folk seed complete — upserted ${upserted}, proposed ${proposed}, deleted ${deleted}`
		);

		return { upserted, proposed, deleted };
	}

	private async loadMatchCandidates(): Promise<MatchCandidate[]> {
		const customers = await this.prisma.shopifyCustomer.findMany({
			select: {
				id: true,
				displayName: true,
				addresses: {
					select: {
						company: true,
						address1: true,
						city: true,
						zip: true,
					},
				},
			},
		});

		return customers.map((customer) => ({
			id: customer.id,
			displayName: customer.displayName ?? '',
			companyNames: customer.addresses
				.map((address) => address.company)
				.filter((company): company is string => Boolean(company?.trim())),
			addresses: customer.addresses.map((address) => ({
				address1: address.address1,
				city: address.city,
				zip: address.zip,
			})),
		}));
	}

	private async pruneMissingCompanies(
		groupIds: string[],
		seenFolkIds: Set<string>
	): Promise<number> {
		if (seenFolkIds.size === 0) {
			this.logger.warn('Skipping Folk cleanup — no companies returned');
			return 0;
		}

		const { count } = await this.prisma.folkCompanyMapping.deleteMany({
			where: {
				folkGroupId: { in: groupIds },
				folkCompanyId: { notIn: [...seenFolkIds] },
			},
		});

		if (count > 0) {
			this.logger.log(`Folk cleanup — removed ${count} stale mapping(s)`);
		}
		return count;
	}

	private async seedGroup(
		groupId: string,
		candidates: MatchCandidate[],
		seenFolkIds: Set<string>
	): Promise<{ upserted: number; proposed: number }> {
		const companies = await this.folkClient.listCompaniesInGroup(groupId);
		this.logger.log(
			`Seeding ${companies.length} Folk companies from group ${groupId}`
		);

		const existingRows = await this.prisma.folkCompanyMapping.findMany({
			where: { folkCompanyId: { in: companies.map((c) => c.id) } },
		});
		const existingByFolkId = new Map(
			existingRows.map((row) => [row.folkCompanyId, row])
		);

		let upserted = 0;
		let proposed = 0;

		for (const company of companies) {
			seenFolkIds.add(company.id);
			const sdCustomerId = this.folkClient.readSdCustomerId(company, groupId);
			const folkEmail = this.folkClient.readEmail(company);
			const match = proposeCustomer(
				company.name,
				company.addresses,
				candidates
			);

			const existing = existingByFolkId.get(company.id);
			const isMapped = existing?.status === FolkMappingStatus.MAPPED;
			const proposal = isMapped
				? null
				: proposalFields(match, existing?.rejectedCustomerId ?? null);

			await this.prisma.folkCompanyMapping.upsert({
				where: { folkCompanyId: company.id },
				create: {
					folkCompanyId: company.id,
					folkGroupId: groupId,
					folkCompanyName: company.name,
					folkEmail,
					sdCustomerId,
					...proposalFields(match, null),
				},
				update: {
					folkCompanyName: company.name,
					folkEmail,
					sdCustomerId,
					folkGroupId: groupId,
					...proposal,
				},
			});

			upserted += 1;
			if (proposal?.proposedCustomerId) proposed += 1;

			if (existing?.status === FolkMappingStatus.MAPPED) {
				await this.mappingService.applyRelationshipFields(
					existing.id,
					company,
					groupId
				);
			}
		}

		return { upserted, proposed };
	}

	async upsertCompanyFromWebhook(companyId: string): Promise<void> {
		const company = await this.folkClient.getCompany(companyId);
		const inScope = await this.groupsService.getTrackedGroupIds();
		const matchingGroup = company.groups.find((group) =>
			inScope.includes(group.id)
		);

		if (!matchingGroup) {
			await this.removeMapping(companyId);
			return;
		}

		const groupId = matchingGroup.id;
		const sdCustomerId = this.folkClient.readSdCustomerId(company, groupId);
		const folkEmail = this.folkClient.readEmail(company);
		const existing = await this.prisma.folkCompanyMapping.findUnique({
			where: { folkCompanyId: companyId },
		});

		if (existing) {
			await this.prisma.folkCompanyMapping.update({
				where: { id: existing.id },
				data: {
					folkCompanyName: company.name,
					folkEmail,
					sdCustomerId,
					folkGroupId: groupId,
				},
			});

			if (existing.status === FolkMappingStatus.MAPPED) {
				await this.mappingService.applyRelationshipFields(
					existing.id,
					company,
					groupId
				);
			}
			return;
		}

		const match = proposeCustomer(
			company.name,
			company.addresses,
			await this.loadMatchCandidates()
		);

		await this.prisma.folkCompanyMapping.create({
			data: {
				folkCompanyId: companyId,
				folkGroupId: groupId,
				folkCompanyName: company.name,
				folkEmail,
				sdCustomerId,
				...proposalFields(match, null),
			},
		});
	}

	async removeMapping(folkCompanyId: string): Promise<void> {
		await this.prisma.folkCompanyMapping.deleteMany({
			where: { folkCompanyId },
		});
	}
}
