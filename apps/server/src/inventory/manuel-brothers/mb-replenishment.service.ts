import { Injectable, Logger } from '@nestjs/common';
import type { BlueboxWorkflowStatusEnum } from '@repo/enums';
import { BlueBoxClient } from 'src/bluebox/bluebox.client';
import type { GmailAttachment } from 'src/gmail/services/gmail.service';
import { PickupRequestEmailService } from 'src/gmail/services/pickup-request-email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	INVENTORY_ADJUST_QUANTITIES_MUTATION,
	type InventoryAdjustQuantitiesResponseType,
	type InventoryAdjustQuantitiesVariablesType,
} from 'src/shopify/queries/inventory.queries';
import { ShopifyGraphqlClient } from 'src/shopify/shopify-graphql.client';
import { ShopifyInventorySyncService } from 'src/shopify/sync/services/shopify-inventory-sync.service';
import { buildShopifyGid } from 'src/shopify/utils/shopify-id.utils';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import { CommonInventoryService } from '../services/common.service';
import type { CreateReplenishmentOrderDto } from './dto/create-replenishment-order.dto';
import { calculateMbPickupDate, formatMbPickupDate } from './mb-pickup-date';

@Injectable()
export class MbReplenishmentService {
	private readonly logger = new Logger(MbReplenishmentService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly blueboxClient: BlueBoxClient,
		private readonly shopifyClient: ShopifyGraphqlClient,
		private readonly commonInventoryService: CommonInventoryService,
		private readonly shopifyInventorySyncService: ShopifyInventorySyncService,
		private readonly pickupRequestEmailService: PickupRequestEmailService
	) {}

	async createOrder(dto: CreateReplenishmentOrderDto) {
		const orderNumber = await this.generateOrderNumber();

		const blueboxPayload = [
			{
				customerOrderNumber: orderNumber,
				orderSource: 'Shopify',
				billTo: {
					companyName: 'Manuel Brothers',
					firstName: null,
					lastName: null,
					address1: 'DO NOT SHIP',
					address2: 'PICK UP ONLY',
					city: 'Phoenix',
					state: 'AZ',
					zip: '89310',
					country: 'US',
				},
				shipTo: {
					companyName: 'Manuel Brothers',
					firstName: null,
					lastName: null,
					address1: 'DO NOT SHIP',
					address2: 'PICK UP ONLY',
					city: 'Phoenix',
					state: 'AZ',
					zip: '89310',
					country: 'US',
					phone: null,
					email: null,
				},
				shipping: {
					shippingCompany: 'Pickup',
					shippingService: 'Pick Up',
				},
				items: dto.items.map((item, i) => ({
					lineNumber: String(i + 1),
					sku: item.sku,
					quantity: item.quantity,
					lineItemNotes: 'Whole order on single pallet',
				})),
			},
		];

		const bbResponse = await this.blueboxClient.post<{
			code: string;
			inserted: { id: number }[];
		}>('/api/bluebox/orders', blueboxPayload);

		const blueboxOrderId = bbResponse?.inserted?.[0]?.id ?? null;

		const order = await this.prisma.replenishmentOrder.create({
			data: {
				orderNumber,
				blueboxOrderId,
				items: {
					create: dto.items.map((item) => ({
						sku: item.sku,
						quantity: item.quantity,
					})),
				},
			},
			include: { items: true },
		});

		const pickupDate = calculateMbPickupDate(order.createdAt);
		this.logger.log(
			`Replenishment order ${orderNumber} created, BB ID: ${blueboxOrderId}, pickup ${formatMbPickupDate(pickupDate)}`
		);

		if (dto.sendPickupEmail) {
			const packingSlip = await this.fetchPackingSlip(
				blueboxOrderId,
				orderNumber
			);
			await this.pickupRequestEmailService.sendPickupRequest(
				order,
				packingSlip
			);
		} else {
			this.logger.log(`Pickup email skipped for ${orderNumber} by request`);
		}

		return this.prisma.replenishmentOrder.findUniqueOrThrow({
			where: { id: order.id },
			include: { items: true },
		});
	}

	/**
	 * Fetch the BlueBox packing slip PDF for a freshly-created order, to attach
	 * to the distributor pickup email. Returns null (and logs) on failure so a
	 * transient API issue never blocks the pickup request itself.
	 */
	private async fetchPackingSlip(
		blueboxOrderId: number | null,
		orderNumber: string
	): Promise<GmailAttachment | null> {
		if (blueboxOrderId == null) return null;

		try {
			const { data, contentType } = await this.blueboxClient.getBinary(
				'/api/bluebox/order/packing-slip/render',
				{ id: blueboxOrderId }
			);
			return {
				filename: `packing-slip-${orderNumber}.pdf`,
				content: data,
				contentType,
			};
		} catch (err) {
			this.logger.warn(
				`Could not fetch packing slip for ${orderNumber} (BB ${blueboxOrderId}): ${(err as Error).message}`
			);
			return null;
		}
	}

	async getOrders() {
		const orders = await this.prisma.replenishmentOrder.findMany({
			include: { items: true },
			orderBy: { createdAt: 'desc' },
		});

		if (orders.length === 0) return [];

		const blueboxOrders = await this.prisma.blueboxOrder.findMany({
			where: {
				customerOrderNumber: { in: orders.map((o) => o.orderNumber) },
			},
			select: {
				customerOrderNumber: true,
				workflowStatus: true,
				isCanceled: true,
			},
		});

		const byOrderNumber = new Map(
			blueboxOrders.map((b) => [b.customerOrderNumber, b])
		);

		return orders.map((order) => {
			const bbOrder = byOrderNumber.get(order.orderNumber);
			return {
				...order,
				pickupDate: calculateMbPickupDate(order.createdAt),
				blueboxStatus:
					(bbOrder?.workflowStatus as BlueboxWorkflowStatusEnum | undefined) ??
					null,
				isBlueboxCancelled: bbOrder?.isCanceled ?? false,
			};
		});
	}

	async checkFulfillment() {
		const pendingOrders = await this.prisma.replenishmentOrder.findMany({
			where: { isProcessed: false },
			include: { items: true },
		});

		if (pendingOrders.length === 0) return;

		for (const order of pendingOrders) {
			try {
				const bbOrder = await this.prisma.blueboxOrder.findFirst({
					where: { customerOrderNumber: order.orderNumber },
				});

				if (!bbOrder) continue;

				const isDelivered =
					bbOrder.deliveryStatus?.toLowerCase() === 'delivered' ||
					bbOrder.workflowStatus?.toLowerCase() === 'delivered' ||
					bbOrder.workflowStatus?.toLowerCase() === 'shipped';

				const isCancelled = bbOrder.isCanceled ?? false;

				// Skip orders that are neither delivered nor cancelled
				if (!isDelivered && !isCancelled) {
					continue;
				}

				// Only adjust inventory for delivered orders
				if (isDelivered) {
					await this.adjustShopifyInventory(order.orderNumber, order.items);
				}

				await this.prisma.replenishmentOrder.update({
					where: { id: order.id },
					data: {
						isProcessed: true,
						blueboxOrderId: bbOrder.blueboxId,
						dataFlowError: null,
					},
				});

				this.logger.log(
					isDelivered
						? `Replenishment order ${order.orderNumber} processed, Shopify inventory adjusted`
						: `Replenishment order ${order.orderNumber} cancelled in BlueBox, inventory left alone`
				);
			} catch (err) {
				const message = (err as Error).message;
				this.logger.error(
					`Failed to process replenishment order ${order.orderNumber}: ${message}`,
					(err as Error).stack
				);
				await this.prisma.replenishmentOrder.update({
					where: { id: order.id },
					data: { dataFlowError: message },
				});
			}
		}
	}

	/**
	 * All items land in one inventoryAdjustQuantities call, or none do. A
	 * partial update would be added again on the next run, because the order is
	 * only marked processed after this returns.
	 */
	private async adjustShopifyInventory(
		orderNumber: string,
		items: { sku: string; quantity: number }[]
	) {
		await this.shopifyInventorySyncService.syncAll();

		const mbLocation =
			await this.commonInventoryService.getLocation('manuel-brothers');
		if (!mbLocation) {
			throw new Error('Manuel Brothers location not found');
		}

		const catalog = await loadSkuCatalog(this.prisma);
		const changes: InventoryAdjustQuantitiesVariablesType['input']['changes'] =
			[];
		const missing: string[] = [];

		for (const item of items) {
			const inventoryItem = await this.prisma.shopifyInventoryItem.findFirst({
				where: {
					sku: { in: catalog.expand([item.sku]), mode: 'insensitive' },
					inventoryLevels: { some: { locationId: mbLocation.id } },
				},
			});

			if (!inventoryItem) {
				missing.push(item.sku);
				continue;
			}

			changes.push({
				delta: item.quantity,
				inventoryItemId: buildShopifyGid(
					'InventoryItem',
					inventoryItem.shopifyId
				),
				locationId: buildShopifyGid('Location', mbLocation.shopifyId),
				changeFromQuantity: null,
			});
		}

		if (missing.length) {
			throw new Error(
				`Cannot add ${orderNumber} to Shopify, SKUs not stocked at Manuel Brothers in Shopify: ${missing.join(', ')}`
			);
		}

		const { inventoryAdjustQuantities } = await this.shopifyClient.request<
			InventoryAdjustQuantitiesResponseType,
			InventoryAdjustQuantitiesVariablesType
		>(INVENTORY_ADJUST_QUANTITIES_MUTATION, {
			input: {
				name: 'available',
				reason: 'received',
				referenceDocumentUri: `gid://sauero/ReplenishmentOrder/${orderNumber}`,
				changes,
			},
		});

		if (inventoryAdjustQuantities.userErrors.length) {
			throw new Error(
				`Shopify rejected the inventory update for ${orderNumber}: ${inventoryAdjustQuantities.userErrors
					.map((e) => e.message)
					.join('; ')}`
			);
		}

		await this.shopifyInventorySyncService.syncAll();
	}

	private async generateOrderNumber(): Promise<string> {
		const lastOrder = await this.prisma.replenishmentOrder.findFirst({
			orderBy: { createdAt: 'desc' },
			select: { orderNumber: true },
		});

		let nextNum = 1;
		if (lastOrder?.orderNumber) {
			const match = lastOrder.orderNumber.match(/MB-(\d+)/);
			if (match) nextNum = parseInt(match[1], 10) + 1;
		}

		return `MB-${String(nextNum).padStart(4, '0')}`;
	}
}
