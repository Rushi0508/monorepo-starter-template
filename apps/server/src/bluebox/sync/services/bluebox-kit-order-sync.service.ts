import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlueBoxClient } from '../../bluebox.client';

interface ExternalKitOrderRawItem {
	sku: string;
	upc: string | null;
	description: string | null;
	quantity: number;
	quantityReserved: number;
	quantityConsumed: number;
	requiredLotNumber: string | null;
	requiredExpirationDate: string | null;
	consumeMethod: string | null;
}

interface ExternalKitOrderFinalItem {
	sku: string;
	upc: string | null;
	description: string | null;
	quantity: number;
	quantityBuilt: number;
}

interface ExternalKitOrder {
	id: number;
	kitConfigId: number | null;
	kitDescription: string | null;
	versionNumber: number | null;
	billableCost: number | null;
	workflowStep: string | null;
	workflowStatus: string | null;
	priority: number | null;
	laneName: string | null;
	physicalWarehouseId: number | null;
	physicalWarehouseName: string | null;
	quantity: number;
	quantityBuilt: number;
	percentComplete: number | null;
	rawVirtualWarehouseName: string | null;
	finalVirtualWarehouseName: string | null;
	createdDate: string | null;
	requestedDate: string | null;
	completedDate: string | null;
	canceledDate: string | null;
	inventoryReserveDate: string | null;
}

interface ExternalKitOrderDetail extends ExternalKitOrder {
	rawItems: ExternalKitOrderRawItem[];
	finalItems: ExternalKitOrderFinalItem[];
	fulfillmentOrderIds: number[] | null;
}

const toDate = (value: string | null) => (value ? new Date(value) : null);

@Injectable()
export class BlueboxKitOrderSyncService {
	private readonly logger = new Logger(BlueboxKitOrderSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly client: BlueBoxClient
	) {}

	async syncKitOrders(): Promise<void> {
		this.logger.log('Starting BlueBox kit order sync');

		const orders = await this.client.get<ExternalKitOrder[]>(
			'/api/bluebox/kit-orders',
			{ status: 'All' }
		);

		if (!orders || orders.length === 0) {
			this.logger.warn('Skipping kit order sync — BlueBox returned none');
			return;
		}

		// Finished orders never change again, so their line items are only
		// fetched once instead of one detail request per order every run.
		const settled = await this.prisma.blueboxKitOrder.findMany({
			where: {
				blueboxId: { in: orders.map((o) => o.id) },
				OR: [{ completedDate: { not: null } }, { canceledDate: { not: null } }],
			},
			select: { blueboxId: true },
		});
		const settledIds = new Set(settled.map((o) => o.blueboxId));
		const pending = orders.filter((o) => !settledIds.has(o.id));

		const limit = pLimit(5);
		await Promise.all(
			pending.map((order) => limit(() => this.syncKitOrder(order.id)))
		);

		const { count } = await this.prisma.blueboxKitOrder.deleteMany({
			where: { blueboxId: { notIn: orders.map((o) => o.id) } },
		});
		if (count > 0) {
			this.logger.log(`Removed ${count} kit orders no longer in BlueBox`);
		}

		this.logger.log(
			`BlueBox kit order sync completed — ${pending.length} of ${orders.length} kit orders refreshed`
		);
	}

	private async syncKitOrder(id: number): Promise<void> {
		const order = await this.client.get<ExternalKitOrderDetail>(
			'/api/bluebox/kit-order',
			{ id }
		);

		const data = {
			kitConfigId: order.kitConfigId,
			kitDescription: order.kitDescription,
			versionNumber: order.versionNumber,
			billableCost: order.billableCost,
			workflowStep: order.workflowStep,
			workflowStatus: order.workflowStatus,
			priority: order.priority,
			laneName: order.laneName,
			physicalWarehouseId: order.physicalWarehouseId,
			physicalWarehouseName: order.physicalWarehouseName,
			quantity: order.quantity,
			quantityBuilt: order.quantityBuilt,
			percentComplete: order.percentComplete,
			rawVirtualWarehouseName: order.rawVirtualWarehouseName,
			finalVirtualWarehouseName: order.finalVirtualWarehouseName,
			fulfillmentOrderIds: order.fulfillmentOrderIds ?? [],
			createdDate: toDate(order.createdDate),
			requestedDate: toDate(order.requestedDate),
			completedDate: toDate(order.completedDate),
			canceledDate: toDate(order.canceledDate),
			inventoryReserveDate: toDate(order.inventoryReserveDate),
		};

		await this.prisma.$transaction(async (tx) => {
			const dbOrder = await tx.blueboxKitOrder.upsert({
				where: { blueboxId: order.id },
				update: data,
				create: { blueboxId: order.id, ...data },
			});

			await tx.blueboxKitOrderFinalItem.deleteMany({
				where: { kitOrderId: dbOrder.id },
			});
			await tx.blueboxKitOrderRawItem.deleteMany({
				where: { kitOrderId: dbOrder.id },
			});

			await tx.blueboxKitOrderFinalItem.createMany({
				data: (order.finalItems ?? []).map((item) => ({
					kitOrderId: dbOrder.id,
					sku: item.sku,
					upc: item.upc,
					description: item.description,
					quantity: item.quantity,
					quantityBuilt: item.quantityBuilt,
				})),
			});
			await tx.blueboxKitOrderRawItem.createMany({
				data: (order.rawItems ?? []).map((item) => ({
					kitOrderId: dbOrder.id,
					sku: item.sku,
					upc: item.upc,
					description: item.description,
					quantity: item.quantity,
					quantityReserved: item.quantityReserved,
					quantityConsumed: item.quantityConsumed,
					requiredLotNumber: item.requiredLotNumber,
					requiredExpirationDate: toDate(item.requiredExpirationDate),
					consumeMethod: item.consumeMethod,
				})),
			});
		});
	}
}
