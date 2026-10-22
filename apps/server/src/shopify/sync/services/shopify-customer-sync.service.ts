import { Injectable, Logger } from '@nestjs/common';
import type { ShopifyCustomer } from '@repo/db';
import { generateSaueroCode } from 'src/customers/sauero-code';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	GET_CUSTOMER_BY_ID,
	GET_CUSTOMERS_PAGE,
	type GetCustomerByIdResponseType,
	type GetCustomersPageResponseType,
	type ShopifyAddressNodeType,
	type ShopifyCustomerNodeType,
} from '../../queries/customer.queries';
import { ShopifyGraphqlClient } from '../../shopify-graphql.client';
import {
	buildShopifyGid,
	extractShopifyId,
} from '../../utils/shopify-id.utils';

@Injectable()
export class ShopifyCustomerSyncService {
	private readonly logger = new Logger(ShopifyCustomerSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly graphql: ShopifyGraphqlClient
	) {}

	async findByShopifyId(shopifyId: string): Promise<ShopifyCustomer | null> {
		return this.prisma.shopifyCustomer.findUnique({ where: { shopifyId } });
	}

	async upsertCustomer(
		node: ShopifyCustomerNodeType
	): Promise<ShopifyCustomer> {
		const shopifyId = extractShopifyId(node.id);
		const defaultAddressShopifyId = node.defaultAddress
			? extractShopifyId(node.defaultAddress.id)
			: null;

		const customer = await this.prisma.shopifyCustomer.upsert({
			where: { shopifyId },
			update: {
				firstName: node.firstName,
				lastName: node.lastName,
				email: node.defaultEmailAddress?.emailAddress ?? null,
				phone: node.defaultPhoneNumber?.phoneNumber ?? null,
				displayName: node.displayName,
				state: node.state,
				note: node.note,
				tags: node.tags,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				firstName: node.firstName,
				lastName: node.lastName,
				email: node.defaultEmailAddress?.emailAddress ?? null,
				phone: node.defaultPhoneNumber?.phoneNumber ?? null,
				displayName: node.displayName,
				state: node.state,
				note: node.note,
				tags: node.tags,
				shopifyCreatedAt: new Date(node.createdAt),
				saueroCode: generateSaueroCode(),
			},
		});

		await Promise.all(
			node.addressesV2.nodes.map((address) =>
				this.upsertAddress(
					address,
					customer.id,
					extractShopifyId(address.id) === defaultAddressShopifyId
				)
			)
		);

		return customer;
	}

	async upsertAddress(
		node: ShopifyAddressNodeType,
		customerId: string,
		isDefault: boolean
	): Promise<void> {
		const shopifyId = extractShopifyId(node.id);

		await this.prisma.shopifyCustomerAddress.upsert({
			where: { shopifyId },
			update: {
				firstName: node.firstName,
				lastName: node.lastName,
				company: node.company,
				address1: node.address1,
				address2: node.address2,
				city: node.city,
				province: node.province,
				country: node.country,
				zip: node.zip,
				phone: node.phone,
				name: node.name,
				provinceCode: node.provinceCode,
				countryCode: node.countryCode,
				isDefault,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				customerId,
				firstName: node.firstName,
				lastName: node.lastName,
				company: node.company,
				address1: node.address1,
				address2: node.address2,
				city: node.city,
				province: node.province,
				country: node.country,
				zip: node.zip,
				phone: node.phone,
				name: node.name,
				provinceCode: node.provinceCode,
				countryCode: node.countryCode,
				isDefault,
			},
		});
	}

	/**
	 * Fetches a single customer from Shopify by ID and upserts it.
	 * Called on-demand when an order references a customer not yet in the DB.
	 */
	async fetchAndUpsertByShopifyId(
		shopifyCustomerId: string
	): Promise<ShopifyCustomer | null> {
		this.logger.log(`On-demand customer fetch: ${shopifyCustomerId}`);

		const gid = buildShopifyGid('Customer', shopifyCustomerId);
		const data = await this.graphql.request<GetCustomerByIdResponseType>(
			GET_CUSTOMER_BY_ID,
			{
				id: gid,
			}
		);

		if (!data.customer) {
			this.logger.warn(`Customer not found on Shopify: ${shopifyCustomerId}`);
			return null;
		}

		return this.upsertCustomer(data.customer);
	}

	/**
	 * Fetches all customers from Shopify page by page and upserts each one.
	 * Called by the scheduler for the full periodic sync.
	 */
	async syncAll(): Promise<void> {
		this.logger.log('Starting full customer sync');

		let cursor: string | null = null;
		let page = 0;
		let total = 0;

		do {
			const data = await this.graphql.request<GetCustomersPageResponseType>(
				GET_CUSTOMERS_PAGE,
				{
					cursor,
				}
			);

			const { edges, pageInfo } = data.customers;

			await Promise.all(edges.map(({ node }) => this.upsertCustomer(node)));

			total += edges.length;
			page++;
			cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

			this.logger.log(
				`Customer sync page ${page}: ${edges.length} customers (${total} total so far)`
			);
		} while (cursor);

		this.logger.log(`Customer sync complete: ${total} customers processed`);
	}
}
