import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopifyOrderSyncService } from '../sync/services/shopify-order-sync.service';
import type { WebhookRefundPayload } from './types/refund-webhook.types';

@Injectable()
export class ShopifyRefundWebhookHandler {
	private readonly logger = new Logger(ShopifyRefundWebhookHandler.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly orderSync: ShopifyOrderSyncService
	) {}

	async handle(payload: WebhookRefundPayload): Promise<void> {
		const shopifyId = payload.id.toString();
		const orderShopifyId = payload.order_id.toString();

		this.logger.log(
			`Processing refund webhook ${shopifyId} for order ${orderShopifyId}`
		);

		const order = await this.ensureOrderExists(orderShopifyId);
		if (!order) {
			this.logger.error(
				`Cannot process refund ${shopifyId}: order ${orderShopifyId} not found`
			);
			throw new Error(
				`Order ${orderShopifyId} not found for refund ${shopifyId}`
			);
		}

		const refund = await this.prisma.shopifyRefund.upsert({
			where: { shopifyId },
			update: {
				note: payload.note,
				processedAt: payload.processed_at
					? new Date(payload.processed_at)
					: null,
			},
			create: {
				shopifyId,
				orderId: order.id,
				note: payload.note,
				processedAt: payload.processed_at
					? new Date(payload.processed_at)
					: null,
				shopifyCreatedAt: new Date(payload.created_at),
			},
		});

		await this.upsertRefundLineItems(payload, refund.id);
		await this.upsertTransactions(payload, refund.id);

		this.logger.log(`Refund ${shopifyId} webhook processed`);
	}

	private async ensureOrderExists(orderShopifyId: string) {
		let order = await this.orderSync.findByShopifyId(orderShopifyId);
		if (!order) {
			order = await this.orderSync.fetchAndUpsertByShopifyId(orderShopifyId);
		}
		return order;
	}

	private async upsertRefundLineItems(
		payload: WebhookRefundPayload,
		refundId: string
	): Promise<void> {
		for (const item of payload.refund_line_items) {
			const shopifyId = item.id.toString();
			const lineItemShopifyId = item.line_item_id.toString();

			const lineItem = await this.prisma.shopifyOrderLineItem.findUnique({
				where: { shopifyId: lineItemShopifyId },
				select: { id: true },
			});

			if (!lineItem) {
				this.logger.warn(
					`Skipping refund line item ${shopifyId}: parent line item ${lineItemShopifyId} not found`
				);
				continue;
			}

			await this.prisma.shopifyRefundLineItem.upsert({
				where: { shopifyId },
				update: {
					quantity: item.quantity,
					subtotal: item.subtotal,
					totalTax: item.total_tax,
				},
				create: {
					shopifyId,
					refundId,
					lineItemId: lineItem.id,
					quantity: item.quantity,
					subtotal: item.subtotal,
					totalTax: item.total_tax,
				},
			});
		}
	}

	private async upsertTransactions(
		payload: WebhookRefundPayload,
		refundId: string
	): Promise<void> {
		for (const tx of payload.transactions ?? []) {
			const shopifyId = tx.id.toString();

			await this.prisma.shopifyRefundTransaction.upsert({
				where: { shopifyId },
				update: {
					amount: parseFloat(tx.amount),
					currency: tx.currency,
					gateway: tx.gateway,
					status: tx.status,
					kind: tx.kind,
				},
				create: {
					shopifyId,
					refundId,
					amount: parseFloat(tx.amount),
					currency: tx.currency,
					gateway: tx.gateway,
					status: tx.status,
					kind: tx.kind,
					shopifyCreatedAt: new Date(tx.created_at),
				},
			});
		}
	}
}
