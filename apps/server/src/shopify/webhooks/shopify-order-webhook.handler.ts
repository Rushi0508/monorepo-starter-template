import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@repo/db';
import { isBundleOrder, isSubscriptionOrder } from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopifyCustomerSyncService } from '../sync/services/shopify-customer-sync.service';
import { ShopifyProductSyncService } from '../sync/services/shopify-product-sync.service';
import type {
	WebhookLineItem,
	WebhookOrderPayload,
} from './types/order-webhook.types';

@Injectable()
export class ShopifyOrderWebhookHandler {
	private readonly logger = new Logger(ShopifyOrderWebhookHandler.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly productSync: ShopifyProductSyncService,
		private readonly customerSync: ShopifyCustomerSyncService
	) {}

	async handle(payload: WebhookOrderPayload): Promise<void> {
		const shopifyId = payload.id.toString();
		this.logger.log(
			`Processing order webhook for #${payload.order_number} (${shopifyId})`
		);

		if (payload.test) {
			await this.prisma.shopifyOrder.deleteMany({ where: { shopifyId } });
			this.logger.log(`Skipped test order #${payload.order_number}`);
			return;
		}

		const customerId = await this.resolveCustomer(payload);

		const tags = payload.tags ? payload.tags.split(', ').filter(Boolean) : [];
		const isBundleOrderFlag = isBundleOrder(tags);
		const isSubscriptionOrderFlag = isSubscriptionOrder(tags);

		const order = await this.prisma.shopifyOrder.upsert({
			where: { shopifyId },
			update: {
				customerId,
				financialStatus: payload.financial_status?.toUpperCase(),
				fulfillmentStatus: payload.fulfillment_status?.toUpperCase(),
				email: payload.email,
				phone: payload.phone,
				note: payload.note,
				noteAttributes:
					payload.note_attributes as unknown as Prisma.InputJsonValue,
				tags,
				sourceName: payload.source_name ?? null,
				subtotalPrice: parseFloat(payload.subtotal_price),
				totalDiscounts: parseFloat(payload.total_discounts),
				totalShippingPrice: parseFloat(
					payload.total_shipping_price_set?.shop_money?.amount ?? '0'
				),
				totalTax: parseFloat(payload.total_tax),
				totalPrice: parseFloat(
					payload.current_total_price || payload.total_price
				),
				currency: payload.currency,
				paymentGatewayNames: payload.payment_gateway_names ?? [],
				shipName: payload.shipping_address?.name ?? null,
				shipCompany: payload.shipping_address?.company ?? null,
				shipAddress1: payload.shipping_address?.address1 ?? null,
				shipAddress2: payload.shipping_address?.address2 ?? null,
				shipCity: payload.shipping_address?.city ?? null,
				shipProvinceCode: payload.shipping_address?.province_code ?? null,
				shipZip: payload.shipping_address?.zip ?? null,
				shipCountryCode: payload.shipping_address?.country_code ?? null,
				shipPhone: payload.shipping_address?.phone ?? null,
				billName: payload.billing_address?.name ?? null,
				billCompany: payload.billing_address?.company ?? null,
				billAddress1: payload.billing_address?.address1 ?? null,
				billAddress2: payload.billing_address?.address2 ?? null,
				billCity: payload.billing_address?.city ?? null,
				billProvinceCode: payload.billing_address?.province_code ?? null,
				billZip: payload.billing_address?.zip ?? null,
				billCountryCode: payload.billing_address?.country_code ?? null,
				billPhone: payload.billing_address?.phone ?? null,
				cancelledAt: payload.cancelled_at
					? new Date(payload.cancelled_at)
					: null,
				cancelReason: payload.cancel_reason,
				closedAt: payload.closed_at ? new Date(payload.closed_at) : null,
				closed: !!payload.closed_at,
				processedAt: payload.processed_at
					? new Date(payload.processed_at)
					: null,
				isBundleOrder: isBundleOrderFlag,
				isSubscriptionOrder: isSubscriptionOrderFlag,
			},
			create: {
				shopifyId,
				customerId,
				orderNumber: payload.order_number,
				financialStatus: payload.financial_status?.toUpperCase(),
				fulfillmentStatus: payload.fulfillment_status?.toUpperCase(),
				email: payload.email,
				phone: payload.phone,
				note: payload.note,
				noteAttributes:
					payload.note_attributes as unknown as Prisma.InputJsonValue,
				tags,
				sourceName: payload.source_name ?? null,
				subtotalPrice: parseFloat(payload.subtotal_price),
				totalDiscounts: parseFloat(payload.total_discounts),
				totalShippingPrice: parseFloat(
					payload.total_shipping_price_set?.shop_money?.amount ?? '0'
				),
				totalTax: parseFloat(payload.total_tax),
				totalPrice: parseFloat(
					payload.current_total_price || payload.total_price
				),
				currency: payload.currency,
				paymentGatewayNames: payload.payment_gateway_names ?? [],
				shipName: payload.shipping_address?.name ?? null,
				shipCompany: payload.shipping_address?.company ?? null,
				shipAddress1: payload.shipping_address?.address1 ?? null,
				shipAddress2: payload.shipping_address?.address2 ?? null,
				shipCity: payload.shipping_address?.city ?? null,
				shipProvinceCode: payload.shipping_address?.province_code ?? null,
				shipZip: payload.shipping_address?.zip ?? null,
				shipCountryCode: payload.shipping_address?.country_code ?? null,
				shipPhone: payload.shipping_address?.phone ?? null,
				billName: payload.billing_address?.name ?? null,
				billCompany: payload.billing_address?.company ?? null,
				billAddress1: payload.billing_address?.address1 ?? null,
				billAddress2: payload.billing_address?.address2 ?? null,
				billCity: payload.billing_address?.city ?? null,
				billProvinceCode: payload.billing_address?.province_code ?? null,
				billZip: payload.billing_address?.zip ?? null,
				billCountryCode: payload.billing_address?.country_code ?? null,
				billPhone: payload.billing_address?.phone ?? null,
				cancelledAt: payload.cancelled_at
					? new Date(payload.cancelled_at)
					: null,
				cancelReason: payload.cancel_reason,
				closedAt: payload.closed_at ? new Date(payload.closed_at) : null,
				closed: !!payload.closed_at,
				processedAt: payload.processed_at
					? new Date(payload.processed_at)
					: null,
				shopifyCreatedAt: new Date(payload.created_at),
				isBundleOrder: isBundleOrderFlag,
				isSubscriptionOrder: isSubscriptionOrderFlag,
			},
		});

		await this.upsertLineItems(payload.line_items, order.id);

		this.logger.log(`Order #${payload.order_number} webhook processed`);
	}

	private async resolveCustomer(
		payload: WebhookOrderPayload
	): Promise<string | null> {
		if (!payload.customer?.id) return null;

		const customerShopifyId = payload.customer.id.toString();
		let customer = await this.customerSync.findByShopifyId(customerShopifyId);

		if (!customer) {
			customer =
				await this.customerSync.fetchAndUpsertByShopifyId(customerShopifyId);
		}

		return customer?.id ?? null;
	}

	private async upsertLineItems(
		lineItems: WebhookLineItem[],
		orderId: string
	): Promise<void> {
		for (const item of lineItems) {
			const shopifyId = item.id.toString();

			let productId: string | null = null;
			let variantId: string | null = null;

			if (item.product_id) {
				const productShopifyId = item.product_id.toString();
				let product = await this.productSync.findByShopifyId(productShopifyId);
				if (!product) {
					product =
						await this.productSync.fetchAndUpsertByShopifyId(productShopifyId);
				}
				productId = product?.id ?? null;
			}

			if (item.variant_id) {
				const variantShopifyId = item.variant_id.toString();
				const variant =
					await this.productSync.findVariantByShopifyId(variantShopifyId);
				variantId = variant?.id ?? null;
			}

			await this.prisma.shopifyOrderLineItem.upsert({
				where: { shopifyId },
				update: {
					sku: item.sku,
					title: item.title,
					variantTitle: item.variant_title,
					vendor: item.vendor,
					quantity: item.quantity,
					price: parseFloat(item.price),
					totalDiscount: parseFloat(item.total_discount),
					fulfillmentStatus: item.fulfillment_status?.toUpperCase(),
					productId,
					variantId,
				},
				create: {
					shopifyId,
					orderId,
					productId,
					variantId,
					sku: item.sku,
					title: item.title,
					variantTitle: item.variant_title,
					vendor: item.vendor,
					quantity: item.quantity,
					price: parseFloat(item.price),
					totalDiscount: parseFloat(item.total_discount),
					fulfillmentStatus: item.fulfillment_status?.toUpperCase(),
				},
			});
		}
	}
}
