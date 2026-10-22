import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopifyOrderSyncService } from '../sync/services/shopify-order-sync.service';
import type { WebhookFulfillmentPayload } from './types/fulfillment-webhook.types';

@Injectable()
export class ShopifyFulfillmentWebhookHandler {
	private readonly logger = new Logger(ShopifyFulfillmentWebhookHandler.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly orderSync: ShopifyOrderSyncService
	) {}

	async handle(payload: WebhookFulfillmentPayload): Promise<void> {
		const shopifyId = payload.id.toString();
		const orderShopifyId = payload.order_id.toString();

		this.logger.log(
			`Processing fulfillment webhook ${shopifyId} for order ${orderShopifyId}`
		);

		const order = await this.ensureOrderExists(orderShopifyId);
		if (!order) {
			this.logger.error(
				`Cannot process fulfillment ${shopifyId}: order ${orderShopifyId} not found`
			);
			throw new Error(
				`Order ${orderShopifyId} not found for fulfillment ${shopifyId}`
			);
		}

		const fulfillment = await this.prisma.shopifyFulfillment.upsert({
			where: { shopifyId },
			update: {
				status: payload.status?.toUpperCase(),
				shipmentStatus: payload.shipment_status?.toUpperCase(),
				trackingCompany: payload.tracking_company,
				trackingNumber: payload.tracking_number,
				trackingNumbers: payload.tracking_numbers ?? [],
				trackingUrl: payload.tracking_url,
				trackingUrls: payload.tracking_urls ?? [],
			},
			create: {
				shopifyId,
				orderId: order.id,
				status: payload.status?.toUpperCase(),
				shipmentStatus: payload.shipment_status?.toUpperCase(),
				trackingCompany: payload.tracking_company,
				trackingNumber: payload.tracking_number,
				trackingNumbers: payload.tracking_numbers ?? [],
				trackingUrl: payload.tracking_url,
				trackingUrls: payload.tracking_urls ?? [],
				shopifyCreatedAt: new Date(payload.created_at),
			},
		});

		await this.upsertFulfillmentLineItems(payload, fulfillment.id);

		this.logger.log(`Fulfillment ${shopifyId} webhook processed`);
	}

	private async ensureOrderExists(orderShopifyId: string) {
		let order = await this.orderSync.findByShopifyId(orderShopifyId);
		if (!order) {
			order = await this.orderSync.fetchAndUpsertByShopifyId(orderShopifyId);
		}
		return order;
	}

	private async upsertFulfillmentLineItems(
		payload: WebhookFulfillmentPayload,
		fulfillmentId: string
	): Promise<void> {
		for (const item of payload.line_items) {
			const lineItemShopifyId = item.id.toString();

			const lineItem = await this.prisma.shopifyOrderLineItem.findUnique({
				where: { shopifyId: lineItemShopifyId },
				select: { id: true },
			});

			if (!lineItem) {
				this.logger.warn(
					`Skipping fulfillment line item: parent line item ${lineItemShopifyId} not found`
				);
				continue;
			}

			const fulfillmentLineItemId = `${payload.id}-${item.id}`;

			await this.prisma.shopifyFulfillmentLineItem.upsert({
				where: { shopifyId: fulfillmentLineItemId },
				update: {
					quantity: item.quantity,
				},
				create: {
					shopifyId: fulfillmentLineItemId,
					fulfillmentId,
					lineItemId: lineItem.id,
					quantity: item.quantity,
				},
			});
		}
	}
}
