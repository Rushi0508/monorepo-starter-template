import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SAMPLE_ORDER_DEFAULT_TAGS } from '@repo/constants';
import type { ShopifyCustomer, ShopifyCustomerAddress } from '@repo/db';
import type {
	CreateSampleOrdersResponseType,
	SampleOrderFailedCustomerType,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	ORDER_CREATE_MUTATION,
	type OrderCreateLineItemInput,
	type OrderCreateResponseType,
	type OrderCreateVariablesType,
	type ShopifyMailingAddressInput,
	type ShopifyMoneyBagInput,
} from 'src/shopify/queries/order.queries';
import {
	FIND_VARIANTS_BY_SKU,
	type FindVariantsBySkuResponseType,
	type FindVariantsBySkuVariablesType,
} from 'src/shopify/queries/product.queries';
import { ShopifyGraphqlClient } from 'src/shopify/shopify-graphql.client';
import { buildShopifyGid } from 'src/shopify/utils/shopify-id.utils';
import { loadSkuCatalog, skuKey } from 'src/sku/sku-catalog';
import type {
	CreateSampleOrdersDto,
	SampleOrderItemDto,
} from '../dto/create-sample-order.dto';

// Unpublished copies of retail products that share their SKU and hold
// Manuel Brothers stock. Samples ship from the retail product.
const DISTRIBUTION_UNIT_TAG = 'distribution-unit';

const ZERO: ShopifyMoneyBagInput = {
	shopMoney: { amount: '0.00', currencyCode: 'USD' },
};

const REQUIRED_ADDRESS_FIELDS = [
	['address1', 'street address'],
	['city', 'city'],
	['zip', 'ZIP'],
	['countryCode', 'country'],
] as const;

type SampleOrderCustomer = ShopifyCustomer & {
	addresses: ShopifyCustomerAddress[];
};

const customerName = (customer: ShopifyCustomer) =>
	[customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
	customer.displayName ||
	customer.email ||
	'Unnamed customer';

@Injectable()
export class SampleOrderService {
	private readonly logger = new Logger(SampleOrderService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly shopifyClient: ShopifyGraphqlClient
	) {}

	/**
	 * Everything that can be checked up front is, and nothing is created unless
	 * every customer and SKU passes. Orders are then created one per customer;
	 * Shopify can still reject one, so failures are reported per customer
	 * instead of failing the whole request. Stock never blocks an order: samples
	 * go out even when Shopify is short, and the short SKUs are reported.
	 */
	async createSampleOrders(
		dto: CreateSampleOrdersDto
	): Promise<CreateSampleOrdersResponseType> {
		const customerIds = [...new Set(dto.customerIds)];
		const customers = await this.prisma.shopifyCustomer.findMany({
			where: { id: { in: customerIds } },
			include: { addresses: { where: { isDefault: true }, take: 1 } },
		});

		const problems: string[] = [];
		if (customers.length !== customerIds.length) {
			problems.push(
				`${customerIds.length - customers.length} selected customer(s) no longer exist.`
			);
		}

		const order = new Map(customerIds.map((id, i) => [id, i]));
		customers.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

		const targets: {
			customer: SampleOrderCustomer;
			shippingAddress: ShopifyMailingAddressInput;
		}[] = [];
		for (const customer of customers) {
			const result = this.toShippingAddress(customer);
			if (typeof result === 'string') {
				problems.push(`${customerName(customer)}: ${result}`);
			} else {
				targets.push({ customer, shippingAddress: result });
			}
		}

		const {
			lineItems,
			warnings,
			problems: skuProblems,
		} = await this.resolveLineItems(dto.items, targets.length);
		problems.push(...skuProblems);

		if (problems.length) {
			throw new BadRequestException(problems.join('\n'));
		}

		let createdCount = 0;
		const failedCustomers: SampleOrderFailedCustomerType[] = [];
		const note = dto.note?.trim() || undefined;
		const tags = [...new Set([...SAMPLE_ORDER_DEFAULT_TAGS, ...dto.tags])];
		for (const { customer, shippingAddress } of targets) {
			if (
				await this.createOrder(customer, shippingAddress, lineItems, {
					note,
					tags,
				})
			) {
				createdCount++;
			} else {
				failedCustomers.push({ id: customer.id, name: customerName(customer) });
			}
		}

		return {
			createdCount,
			failedCount: failedCustomers.length,
			failedCustomers,
			warnings: createdCount ? warnings : [],
		};
	}

	private toShippingAddress(
		customer: SampleOrderCustomer
	): ShopifyMailingAddressInput | string {
		const address = customer.addresses[0];
		if (!address) return 'no default shipping address in Shopify.';

		const missing = REQUIRED_ADDRESS_FIELDS.filter(
			([key]) => !address[key]?.trim()
		);
		if (missing.length) {
			return `default address is missing ${missing.map(([, label]) => label).join(', ')}.`;
		}

		return {
			firstName: address.firstName ?? customer.firstName,
			lastName: address.lastName ?? customer.lastName,
			company: address.company,
			address1: address.address1,
			address2: address.address2,
			city: address.city,
			provinceCode: address.provinceCode,
			countryCode: address.countryCode,
			zip: address.zip,
			phone: address.phone ?? customer.phone,
		};
	}

	private async resolveLineItems(
		items: SampleOrderItemDto[],
		orderCount: number
	) {
		const problems: string[] = [];
		const lineItems: OrderCreateLineItemInput[] = [];
		const warnings: string[] = [];

		const quantities = new Map<string, number>();
		const catalog = await loadSkuCatalog(this.prisma);
		for (const item of items) {
			const entry = catalog.resolve(item.sku);
			if (!entry) {
				problems.push(`${item.sku}: not in SKU settings.`);
				continue;
			}
			quantities.set(
				entry.sku,
				(quantities.get(entry.sku) ?? 0) + item.quantity
			);
		}
		if (!quantities.size) return { lineItems, warnings, problems };

		const codes = catalog.expand([...quantities.keys()]);
		const { productVariants } = await this.shopifyClient.request<
			FindVariantsBySkuResponseType,
			FindVariantsBySkuVariablesType
		>(FIND_VARIANTS_BY_SKU, {
			query: codes
				.map((code) => `sku:"${code.replace(/"/g, '\\"')}"`)
				.join(' OR '),
		});

		for (const [sku, quantity] of quantities) {
			const codeKeys = new Set(catalog.expand([sku]).map(skuKey));
			const matches = productVariants.nodes.filter(
				(v) => v.sku && codeKeys.has(skuKey(v.sku))
			);
			const allActive = matches.filter((v) => v.product.status === 'ACTIVE');
			const retail = allActive.filter(
				(v) => !v.product.tags.includes(DISTRIBUTION_UNIT_TAG)
			);
			const active = retail.length ? retail : allActive;

			if (!matches.length) {
				problems.push(`${sku}: no variant with this SKU in Shopify.`);
			} else if (!active.length) {
				problems.push(
					`${sku}: Shopify product "${matches[0].product.title}" is ${matches[0].product.status.toLowerCase()}, not active.`
				);
			} else if (active.length > 1) {
				problems.push(
					`${sku}: matches ${active.length} active Shopify variants (${active
						.map((v) => `${v.product.title} / ${v.title}`)
						.join('; ')}).`
				);
			} else {
				const [variant] = active;
				const available = variant.inventoryQuantity ?? 0;
				const needed = quantity * orderCount;
				if (variant.inventoryItem.tracked && available < needed) {
					warnings.push(
						`${sku}: Shopify has ${Math.max(available, 0)} in stock but these orders need ${needed}. The orders were still created.`
					);
				}
				lineItems.push({
					variantId: variant.id,
					quantity,
					priceSet: ZERO,
					requiresShipping: true,
				});
			}
		}

		return { lineItems, warnings, problems };
	}

	private async createOrder(
		customer: SampleOrderCustomer,
		shippingAddress: ShopifyMailingAddressInput,
		lineItems: OrderCreateLineItemInput[],
		{ note, tags }: { note?: string; tags: string[] }
	): Promise<boolean> {
		try {
			const { orderCreate } = await this.shopifyClient.request<
				OrderCreateResponseType,
				OrderCreateVariablesType
			>(ORDER_CREATE_MUTATION, {
				order: {
					customer: {
						toAssociate: {
							id: buildShopifyGid('Customer', customer.shopifyId),
						},
					},
					email: customer.email,
					shippingAddress,
					billingAddress: shippingAddress,
					lineItems,
					financialStatus: 'PAID',
					note,
					tags,
				},
				options: {
					inventoryBehaviour: 'DECREMENT_IGNORING_POLICY',
					sendReceipt: false,
					sendFulfillmentReceipt: false,
				},
			});

			if (orderCreate.userErrors.length || !orderCreate.order) {
				this.logger.error(
					`Shopify rejected sample order for customer ${customer.id}: ${
						orderCreate.userErrors.map((e) => e.message).join(' ') ||
						'no order returned'
					}`
				);
				return false;
			}
			return true;
		} catch (err) {
			this.logger.error(
				`Sample order for customer ${customer.id} failed`,
				err as Error
			);
			return false;
		}
	}
}
