import { Injectable, Logger } from '@nestjs/common';
import { FolkMappingStatus } from '@repo/db';
import { CustomerProvisioningService } from 'src/customers/services';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient } from '../folk.client';
import { parseFolkAddress } from '../utils/folk-address';
import { FolkMappingService } from './folk-mapping.service';

export type FolkShopifyPushResult = {
	considered: number;
	created: number;
	linkedExisting: number;
	failed: number;
};

// Shopify only accepts E.164 phone numbers and rejects the whole customer
// over a bad one, so anything that is not a clear US number is dropped.
const toE164 = (raw: string | undefined): string | null => {
	const digits = raw?.replace(/\D/g, '') ?? '';
	if (digits.length === 10) return `+1${digits}`;
	if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
	return null;
};

@Injectable()
export class FolkShopifyCustomersService {
	private readonly logger = new Logger(FolkShopifyCustomersService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient,
		private readonly mappingService: FolkMappingService,
		private readonly customerProvisioning: CustomerProvisioningService
	) {}

	/**
	 * Unmapped companies have no Shopify customer, so one is created from the
	 * Folk record and linked back. Pending proposals wait for review, so a
	 * proposal that was right never turns into a duplicate customer.
	 */
	async pushUnmappedCompanies(): Promise<FolkShopifyPushResult> {
		const mappings = await this.prisma.folkCompanyMapping.findMany({
			where: { status: FolkMappingStatus.UNMAPPED, shopifyPushedAt: null },
		});

		const result: FolkShopifyPushResult = {
			considered: mappings.length,
			created: 0,
			linkedExisting: 0,
			failed: 0,
		};

		for (const mapping of mappings) {
			try {
				const company = await this.folkClient.getCompany(mapping.folkCompanyId);
				const email = this.folkClient.readEmail(company);
				if (!email) {
					throw new Error('No email on the company in Folk');
				}

				const address = company.addresses
					.map(parseFolkAddress)
					.find((parsed) => parsed !== null);

				const { customer, created } =
					await this.customerProvisioning.ensureShopifyCustomer(
						{
							firstName: company.name,
							email,
							phone: toE164(company.phones[0]),
							address: address ? { ...address, company: company.name } : null,
						},
						'folk'
					);

				await this.mappingService.linkCustomer(mapping.id, customer.id);
				await this.prisma.folkCompanyMapping.update({
					where: { id: mapping.id },
					data: {
						folkEmail: email,
						shopifyPushedAt: new Date(),
						shopifyPushError: null,
					},
				});

				if (created) result.created++;
				else result.linkedExisting++;
			} catch (err) {
				result.failed++;
				const message = (err as Error).message;
				this.logger.warn(
					`Could not push Folk company ${mapping.folkCompanyName} (${mapping.folkCompanyId}) to Shopify: ${message}`
				);
				await this.prisma.folkCompanyMapping.update({
					where: { id: mapping.id },
					data: { shopifyPushError: message },
				});
			}
		}

		this.logger.log(
			`Folk to Shopify push: considered ${result.considered}, created ${result.created}, linked existing ${result.linkedExisting}, failed ${result.failed}`
		);
		return result;
	}
}
