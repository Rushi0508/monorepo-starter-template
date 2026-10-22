import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, ShopifyOrder } from '@repo/db';
import {
	isBundleOrder,
	isSubscriptionOrder,
	transformBundleLineItems,
} from '@repo/utils';
import pLimit from 'p-limit';
import { DeliveryRequestEmailService } from 'src/gmail/services/delivery-request-email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	GET_ORDER_BY_ID,
	GET_ORDERS_UPDATED_SINCE,
	GET_TEST_ORDER_IDS,
	type GetOrdersPageResponseType,
	type GetTestOrderIdsResponseType,
	type ShopifyFulfillmentNodeType,
	type ShopifyOrderNodeType,
	type ShopifyRefundNodeType,
} from '../../queries/order.queries';
import { ShopifyGraphqlClient } from '../../shopify-graphql.client';
import {
	buildShopifyGid,
	extractShopifyId,
} from '../../utils/shopify-id.utils';
import { ShopifyCustomerSyncService } from './shopify-customer-sync.service';
import { ShopifyProductSyncService } from './shopify-product-sync.service';

@Injectable()
export class ShopifyOrderSyncService {
	private readonly logger = new Logger(ShopifyOrderSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly graphql: ShopifyGraphqlClient,
		private readonly productSync: ShopifyProductSyncService,
		private readonly customerSync: ShopifyCustomerSyncService,
		private readonly deliveryEmail: DeliveryRequestEmailService
	) {}

	async findByShopifyId(shopifyId: string): Promise<ShopifyOrder | null> {
		return this.prisma.shopifyOrder.findUnique({ where: { shopifyId } });
	}

	async upsertOrder(node: ShopifyOrderNodeType): Promise<ShopifyOrder | null> {
		const shopifyId = extractShopifyId(node.id);

		if (node.test) {
			await this.prisma.shopifyOrder.deleteMany({ where: { shopifyId } });
			return null;
		}

		// Resolve customer FK — extract numeric ID then look up / fetch on-demand
		let customerId: string | null = null;
		if (node.customer?.id) {
			const customerShopifyId = extractShopifyId(node.customer.id);
			let customer = await this.customerSync.findByShopifyId(customerShopifyId);
			if (!customer) {
				customer =
					await this.customerSync.fetchAndUpsertByShopifyId(customerShopifyId);
			}
			customerId = customer?.id ?? null;
		}

		const isBundleOrderFlag = isBundleOrder(node.tags);
		const isSubscriptionOrderFlag = isSubscriptionOrder(node.tags);

		const existing = await this.findByShopifyId(shopifyId);
		const isFirstSync = !existing?.appName;

		const order = await this.prisma.shopifyOrder.upsert({
			where: { shopifyId },
			update: {
				orderName: node.name,
				customerId,
				financialStatus: node.displayFinancialStatus,
				fulfillmentStatus: node.displayFulfillmentStatus,
				email: node.email,
				phone: node.phone,
				note: node.note,
				noteAttributes:
					node.customAttributes as unknown as Prisma.InputJsonValue,
				tags: node.tags,
				sourceName: node.sourceName ?? null,
				appName: node.app?.name ?? null,
				subtotalPrice: parseFloat(node.subtotalPriceSet.shopMoney.amount),
				totalDiscounts: parseFloat(node.totalDiscountsSet.shopMoney.amount),
				totalShippingPrice: parseFloat(
					node.totalShippingPriceSet.shopMoney.amount
				),
				totalTax: parseFloat(node.totalTaxSet.shopMoney.amount),
				totalPrice: parseFloat(node.currentTotalPriceSet.shopMoney.amount),
				currency: node.currencyCode,
				paymentTerms: node.paymentTerms?.translatedName ?? null,
				paymentGatewayNames: node.paymentGatewayNames,
				shipName: node.shippingAddress?.name,
				shipCompany: node.shippingAddress?.company,
				shipAddress1: node.shippingAddress?.address1,
				shipAddress2: node.shippingAddress?.address2,
				shipCity: node.shippingAddress?.city,
				shipProvinceCode: node.shippingAddress?.provinceCode,
				shipZip: node.shippingAddress?.zip,
				shipCountryCode: node.shippingAddress?.countryCode,
				shipPhone: node.shippingAddress?.phone,
				billName: node.billingAddress?.name,
				billCompany: node.billingAddress?.company,
				billAddress1: node.billingAddress?.address1,
				billAddress2: node.billingAddress?.address2,
				billCity: node.billingAddress?.city,
				billProvinceCode: node.billingAddress?.provinceCode,
				billZip: node.billingAddress?.zip,
				billCountryCode: node.billingAddress?.countryCode,
				billPhone: node.billingAddress?.phone,
				cancelledAt: node.cancelledAt ? new Date(node.cancelledAt) : null,
				cancelReason: node.cancelReason,
				closed: node.closed,
				closedAt: node.closedAt ? new Date(node.closedAt) : null,
				processedAt: node.processedAt ? new Date(node.processedAt) : null,
				updatedAt: new Date(),
				shopifyUpdatedAt: new Date(node.updatedAt),
				isBundleOrder: isBundleOrderFlag,
				isSubscriptionOrder: isSubscriptionOrderFlag,
			},
			create: {
				shopifyId,
				customerId,
				orderNumber: node.number,
				orderName: node.name,
				financialStatus: node.displayFinancialStatus,
				fulfillmentStatus: node.displayFulfillmentStatus,
				email: node.email,
				phone: node.phone,
				note: node.note,
				noteAttributes:
					node.customAttributes as unknown as Prisma.InputJsonValue,
				tags: node.tags,
				sourceName: node.sourceName ?? null,
				appName: node.app?.name ?? null,
				subtotalPrice: parseFloat(node.subtotalPriceSet.shopMoney.amount),
				totalDiscounts: parseFloat(node.totalDiscountsSet.shopMoney.amount),
				totalShippingPrice: parseFloat(
					node.totalShippingPriceSet.shopMoney.amount
				),
				totalTax: parseFloat(node.totalTaxSet.shopMoney.amount),
				totalPrice: parseFloat(node.currentTotalPriceSet.shopMoney.amount),
				currency: node.currencyCode,
				paymentTerms: node.paymentTerms?.translatedName ?? null,
				paymentGatewayNames: node.paymentGatewayNames,
				shipName: node.shippingAddress?.name,
				shipCompany: node.shippingAddress?.company,
				shipAddress1: node.shippingAddress?.address1,
				shipAddress2: node.shippingAddress?.address2,
				shipCity: node.shippingAddress?.city,
				shipProvinceCode: node.shippingAddress?.provinceCode,
				shipZip: node.shippingAddress?.zip,
				shipCountryCode: node.shippingAddress?.countryCode,
				shipPhone: node.shippingAddress?.phone,
				billName: node.billingAddress?.name,
				billCompany: node.billingAddress?.company,
				billAddress1: node.billingAddress?.address1,
				billAddress2: node.billingAddress?.address2,
				billCity: node.billingAddress?.city,
				billProvinceCode: node.billingAddress?.provinceCode,
				billZip: node.billingAddress?.zip,
				billCountryCode: node.billingAddress?.countryCode,
				billPhone: node.billingAddress?.phone,
				cancelledAt: node.cancelledAt ? new Date(node.cancelledAt) : null,
				cancelReason: node.cancelReason,
				closed: node.closed,
				closedAt: node.closedAt ? new Date(node.closedAt) : null,
				processedAt: node.processedAt ? new Date(node.processedAt) : null,
				shopifyCreatedAt: new Date(node.createdAt),
				shopifyUpdatedAt: new Date(node.updatedAt),
				isBundleOrder: isBundleOrderFlag,
				isSubscriptionOrder: isSubscriptionOrderFlag,
			},
		});

		const { lineItemDiscountDelta, isBundle } = await this.upsertLineItems(
			node,
			order.id
		);

		if (isBundle) {
			const totalDiscountDelta = Number(
				(order.totalDiscounts ?? 0) - lineItemDiscountDelta
			);
			await this.prisma.shopifyOrder.update({
				where: { id: order.id },
				data: { totalDiscounts: totalDiscountDelta },
			});
		}

		await this.upsertRefunds(node.refunds, order.id);
		await this.upsertFulfillments(node.fulfillments, order.id);

		if (isFirstSync) {
			await this.deliveryEmail.handleOrderCreated(node, order.id);
		}

		return order;
	}

	private async upsertLineItems(node: ShopifyOrderNodeType, orderId: string) {
		const { lineItems, lineItemDiscountDelta, isBundle } =
			transformBundleLineItems(
				node.lineItems.edges.map(({ node }) => ({
					...node,
					sku: node.sku ?? '',
					price: parseFloat(node.originalUnitPriceSet.shopMoney.amount),
					totalDiscount: parseFloat(node.totalDiscountSet.shopMoney.amount),
				}))
			);

		// Delete everything that is no longer present AFTER transformation
		const currentLineItemIds = lineItems.map((lineItem) =>
			extractShopifyId(lineItem.id)
		);

		await this.prisma.shopifyOrderLineItem.deleteMany({
			where: {
				orderId,
				shopifyId: {
					notIn: currentLineItemIds,
				},
			},
		});

		await Promise.all(
			lineItems.map(async (lineItem) => {
				const lineItemShopifyId = extractShopifyId(lineItem.id);

				// Resolve product FK — extract numeric ID then look up / fetch on-demand
				// Handles the edge case where a product was created after the last product cron run
				let productId: string | null = null;
				let variantId: string | null = null;

				if (lineItem.product?.id) {
					const productShopifyId = extractShopifyId(lineItem.product.id);
					let product =
						await this.productSync.findByShopifyId(productShopifyId);
					if (!product) {
						product =
							await this.productSync.fetchAndUpsertByShopifyId(
								productShopifyId
							);
					}
					productId = product?.id ?? null;
				}

				if (lineItem.variant?.id) {
					const variantShopifyId = extractShopifyId(lineItem.variant.id);
					const variant =
						await this.productSync.findVariantByShopifyId(variantShopifyId);
					variantId = variant?.id ?? null;
				}

				const data = {
					orderId,
					productId,
					variantId,
					sku: lineItem.sku,
					title: lineItem.title,
					variantTitle: lineItem.variantTitle,
					vendor: lineItem.vendor,
					quantity: lineItem.quantity,
					currentQuantity: lineItem.currentQuantity,
					price: lineItem.price,
					totalDiscount: lineItem.totalDiscount,
					discountAllocations:
						lineItem.discountAllocations as unknown as Prisma.InputJsonValue,
					fulfillmentStatus: lineItem.fulfillmentStatus,
					requiresShipping: lineItem.requiresShipping,
					taxable: lineItem.taxable,
					giftCard: lineItem.isGiftCard,
				};

				await this.prisma.shopifyOrderLineItem.upsert({
					where: { shopifyId: lineItemShopifyId },
					update: {
						...data,
						updatedAt: new Date(),
					},
					create: {
						...data,
						shopifyId: lineItemShopifyId,
					},
				});
			})
		);

		return { lineItemDiscountDelta, isBundle };
	}

	private async upsertRefunds(
		refunds: ShopifyRefundNodeType[],
		orderId: string
	): Promise<void> {
		const currentRefundIds = refunds.map((refund) =>
			extractShopifyId(refund.id)
		);

		await this.prisma.shopifyRefund.deleteMany({
			where: {
				orderId,
				shopifyId: {
					notIn: currentRefundIds,
				},
			},
		});

		await Promise.all(
			refunds.map(async (refund) => {
				const refundShopifyId = extractShopifyId(refund.id);

				const refundRecord = await this.prisma.shopifyRefund.upsert({
					where: { shopifyId: refundShopifyId },
					update: {
						note: refund.note,
						processedAt: refund.processedAt
							? new Date(refund.processedAt)
							: null,
						updatedAt: new Date(),
					},
					create: {
						shopifyId: refundShopifyId,
						orderId,
						note: refund.note,
						processedAt: refund.processedAt
							? new Date(refund.processedAt)
							: null,
						shopifyCreatedAt: new Date(refund.createdAt),
					},
				});

				// Refund line items
				await Promise.all(
					refund.refundLineItems.edges.map(async ({ node: rli }) => {
						const rliShopifyId = extractShopifyId(rli.id);
						const lineItemShopifyId = extractShopifyId(rli.lineItem.id);

						const lineItem = await this.prisma.shopifyOrderLineItem.findUnique({
							where: { shopifyId: lineItemShopifyId },
						});
						if (!lineItem) return;

						await this.prisma.shopifyRefundLineItem.upsert({
							where: { shopifyId: rliShopifyId },
							update: {
								quantity: rli.quantity,
								subtotal: parseFloat(rli.subtotalSet.shopMoney.amount),
								totalTax: parseFloat(rli.totalTaxSet.shopMoney.amount),
								updatedAt: new Date(),
							},
							create: {
								shopifyId: rliShopifyId,
								refundId: refundRecord.id,
								lineItemId: lineItem.id,
								quantity: rli.quantity,
								subtotal: parseFloat(rli.subtotalSet.shopMoney.amount),
								totalTax: parseFloat(rli.totalTaxSet.shopMoney.amount),
							},
						});
					})
				);

				// Refund transactions
				await Promise.all(
					refund.transactions.edges.map(async ({ node: tx }) => {
						await this.prisma.shopifyRefundTransaction.upsert({
							where: { shopifyId: extractShopifyId(tx.id) },
							update: {
								amount: parseFloat(tx.amountSet.shopMoney.amount),
								currency: tx.amountSet.shopMoney.currencyCode,
								gateway: tx.gateway,
								status: tx.status,
								kind: tx.kind,
								updatedAt: new Date(),
							},
							create: {
								shopifyId: extractShopifyId(tx.id),
								refundId: refundRecord.id,
								amount: parseFloat(tx.amountSet.shopMoney.amount),
								currency: tx.amountSet.shopMoney.currencyCode,
								gateway: tx.gateway,
								status: tx.status,
								kind: tx.kind,
								shopifyCreatedAt: new Date(tx.createdAt),
							},
						});
					})
				);
			})
		);
	}

	private async upsertFulfillments(
		fulfillments: ShopifyFulfillmentNodeType[],
		orderId: string
	): Promise<void> {
		const currentFulfillmentIds = fulfillments.map((fulfillment) =>
			extractShopifyId(fulfillment.id)
		);

		await this.prisma.shopifyFulfillment.deleteMany({
			where: {
				orderId,
				shopifyId: {
					notIn: currentFulfillmentIds,
				},
			},
		});

		await Promise.all(
			fulfillments.map(async (fulfillment) => {
				const fulfillmentShopifyId = extractShopifyId(fulfillment.id);
				const trackingNumbers = fulfillment.trackingInfo
					.map((t) => t.number)
					.filter(Boolean) as string[];
				const trackingUrls = fulfillment.trackingInfo
					.map((t) => t.url)
					.filter(Boolean) as string[];
				const primaryTracking = fulfillment.trackingInfo[0];

				const fulfillmentRecord = await this.prisma.shopifyFulfillment.upsert({
					where: { shopifyId: fulfillmentShopifyId },
					update: {
						status: fulfillment.status,
						shipmentStatus: fulfillment.displayStatus,
						trackingCompany: primaryTracking?.company ?? null,
						trackingNumber: primaryTracking?.number ?? null,
						trackingNumbers,
						trackingUrl: primaryTracking?.url ?? null,
						trackingUrls,
						deliveredAt: fulfillment.deliveredAt
							? new Date(fulfillment.deliveredAt)
							: null,
						inTransitAt: fulfillment.inTransitAt
							? new Date(fulfillment.inTransitAt)
							: null,
						estimatedDeliveryAt: fulfillment.estimatedDeliveryAt
							? new Date(fulfillment.estimatedDeliveryAt)
							: null,
						updatedAt: new Date(),
					},
					create: {
						shopifyId: fulfillmentShopifyId,
						orderId,
						status: fulfillment.status,
						shipmentStatus: fulfillment.displayStatus,
						trackingCompany: primaryTracking?.company ?? null,
						trackingNumber: primaryTracking?.number ?? null,
						trackingNumbers,
						trackingUrl: primaryTracking?.url ?? null,
						trackingUrls,
						deliveredAt: fulfillment.deliveredAt
							? new Date(fulfillment.deliveredAt)
							: null,
						inTransitAt: fulfillment.inTransitAt
							? new Date(fulfillment.inTransitAt)
							: null,
						estimatedDeliveryAt: fulfillment.estimatedDeliveryAt
							? new Date(fulfillment.estimatedDeliveryAt)
							: null,
						shopifyCreatedAt: new Date(fulfillment.createdAt),
					},
				});

				// Fulfillment line items
				await Promise.all(
					fulfillment.fulfillmentLineItems.edges.map(async ({ node: fli }) => {
						const fliShopifyId = extractShopifyId(fli.id);
						const lineItemShopifyId = extractShopifyId(fli.lineItem.id);

						const lineItem = await this.prisma.shopifyOrderLineItem.findUnique({
							where: { shopifyId: lineItemShopifyId },
						});
						if (!lineItem) return;

						await this.prisma.shopifyFulfillmentLineItem.upsert({
							where: { shopifyId: fliShopifyId },
							update: { quantity: fli.quantity, updatedAt: new Date() },
							create: {
								shopifyId: fliShopifyId,
								fulfillmentId: fulfillmentRecord.id,
								lineItemId: lineItem.id,
								quantity: fli.quantity,
							},
						});
					})
				);
			})
		);
	}

	/**
	 * Fetches a single order from Shopify by ID and upserts it with all nested records.
	 * Accepts either a plain numeric ID (from webhooks) or a full GID (from GraphQL).
	 */
	async fetchAndUpsertByShopifyId(
		shopifyOrderId: string
	): Promise<ShopifyOrder | null> {
		this.logger.log(`On-demand order fetch: ${shopifyOrderId}`);

		const gid = buildShopifyGid('Order', shopifyOrderId);
		const data = await this.graphql.request<{
			order: ShopifyOrderNodeType | null;
		}>(GET_ORDER_BY_ID, {
			id: gid,
		});

		if (!data.order) {
			this.logger.warn(`Order not found on Shopify: ${shopifyOrderId}`);
			return null;
		}

		return this.upsertOrder(data.order);
	}

	/**
	 * Reconciliation sync: fetches all orders updated within the given window and upserts them.
	 * Called by the scheduler every 30 minutes with a 2-hour rolling window.
	 */
	async syncUpdatedSince(since?: Date): Promise<void> {
		const sinceIso = since?.toISOString();
		this.logger.log(`Starting order reconciliation since ${sinceIso}`);

		let cursor: string | null = null;
		let page = 0;
		let total = 0;

		const query = sinceIso ? `updated_at:>='${sinceIso}'` : '';

		do {
			const data = await this.graphql.request<GetOrdersPageResponseType>(
				GET_ORDERS_UPDATED_SINCE,
				{
					query,
					cursor,
				}
			);

			const { edges, pageInfo } = data.orders;

			const limit = pLimit(3);

			await Promise.all(
				edges.map(({ node }) => limit(() => this.upsertOrder(node)))
			);

			total += edges.length;
			page++;
			cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

			this.logger.log(
				`Order reconciliation page ${page}: ${edges.length} orders (${total} total so far)`
			);
		} while (cursor);

		this.logger.log(`Order reconciliation complete: ${total} orders processed`);

		await this.purgeTestOrders();
	}

	/**
	 * Test orders that were already stored before they were skipped on sync are
	 * never revisited by the updated-since window, so they are looked up directly.
	 */
	private async purgeTestOrders(): Promise<void> {
		const shopifyIds: string[] = [];
		let cursor: string | null = null;
		do {
			const data: GetTestOrderIdsResponseType =
				await this.graphql.request<GetTestOrderIdsResponseType>(
					GET_TEST_ORDER_IDS,
					{ cursor }
				);
			shopifyIds.push(...data.orders.nodes.map((o) => extractShopifyId(o.id)));
			cursor = data.orders.pageInfo.hasNextPage
				? data.orders.pageInfo.endCursor
				: null;
		} while (cursor);

		if (!shopifyIds.length) return;
		const { count } = await this.prisma.shopifyOrder.deleteMany({
			where: { shopifyId: { in: shopifyIds } },
		});
		if (count) this.logger.log(`Removed ${count} Shopify test orders`);
	}
}
