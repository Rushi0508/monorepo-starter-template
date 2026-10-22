import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlueBoxClient } from '../../bluebox.client';

interface RestOrderAddress {
	companyName: string | null;
	firstName: string | null;
	lastName: string | null;
	address1: string | null;
	address2: string | null;
	city: string | null;
	state: string | null;
	zip: string | null;
	country: string | null;
	phone: string | null;
	email: string | null;
}

interface RestOrderShipping {
	shippingCompany: string | null;
	shippingService: string | null;
}

interface RestOrderPayment {
	status: string | null;
	paidAmount: number | null;
	paymentMethod: string | null;
}

interface RestOrderItem {
	id: number;
	skuId: number | null;
	sku: string | null;
	upc: string | null;
	quantity: number | null;
	quantityCanceled: number | null;
	price: number | null;
	discountAmount: number | null;
	notes: string | null;
	weight: number | null;
	description: string | null;
	options: unknown | null;
	requiredLotNumber: string | null;
}

interface RestOrder {
	id: number;
	orderNumber: string | null;
	customerOrderNumber: string | null;
	customerNumber: string | null;
	externalId: string | null;
	externalSource: string | null;
	orderSource: string | null;
	status: string | null;
	trackingNumber: string | null;
	shippingCost: number | null;
	physicalWarehouse: string | null;
	discountAmount: number | null;
	taxAmount: number | null;
	memo: string | null;
	poNumber: string | null;
	isCanceled: boolean;
	isRushOrder: boolean;
	dateOrderReceived: string | null;
	dateOrderShipped: string | null;
	dateOrderDelivered: string | null;
	dateOrderPicked: string | null;
	dateOrderPacked: string | null;
	createDateTime: string | null;
	shipTo: RestOrderAddress | null;
	shipping: RestOrderShipping | null;
	payment: RestOrderPayment | null;
	items: RestOrderItem[] | null;
}

interface OrderStatus {
	id: number;
	externalId: string | null;
	deliveredDate: string | null;
	deliveryStatus: string | null;
	workflowStatus: string | null;
	masterTracking: string | null;
	trackingNumbers: string[];
	checkpoints: CheckPoint[];
}

interface CheckPoint {
	date: string | null;
	city: string | null;
	country: string | null;
	tag: string | null;
	zip: string | null;
	state: string | null;
	carrier: string | null;
	message: string | null;
}

interface AftershipCheckpoint {
	created_at: string | null;
	slug: string | null;
	checkpoint_time: string | null;
	location: string | null;
	city: string | null;
	state: string | null;
	country_region: string | null;
	country_region_name: string | null;
	message: string | null;
	tag: string | null;
	zip: string | null;
}

// lastSyncedAt is stamped when a run finishes, so orders updated mid-run would otherwise be skipped.
const SYNC_OVERLAP_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class BlueboxOrderSyncService {
	private readonly logger = new Logger(BlueboxOrderSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly client: BlueBoxClient
	) {}

	async syncOrders(): Promise<void> {
		this.logger.log('Starting BlueBox order sync');

		let page = 1;
		const pageSize = 100;
		let totalSynced = 0;

		const limit = pLimit(5);

		while (true) {
			const orders = await this.client.get<RestOrder[]>('/api/bluebox/orders', {
				page,
				pageSize,
			});

			if (!orders || orders.length === 0) break;

			await Promise.all(
				orders.map((order) => limit(() => this.upsertOrder(order)))
			);

			totalSynced += orders.length;

			if (orders.length < pageSize) break;
			page++;
		}

		this.logger.log(
			`BlueBox order sync completed — ${totalSynced} orders synced`
		);
	}

	async syncUpdatedSince(since?: Date): Promise<void> {
		const updatedFrom = since
			? new Date(since.getTime() - SYNC_OVERLAP_MS)
			: undefined;
		this.logger.log(
			`Syncing orders updated since ${updatedFrom?.toISOString()}`
		);

		let page = 1;
		const pageSize = 100;
		let totalSynced = 0;
		const limit = pLimit(5);

		while (true) {
			const orders = await this.client.get<RestOrder[]>('/api/bluebox/orders', {
				page,
				pageSize,
				...(updatedFrom
					? { minLastUpdatedDateTime: updatedFrom.toISOString() }
					: {}),
			});

			this.logger.log(`Found ${orders.length} orders at page ${page}`);

			if (!orders || orders.length === 0) break;

			await Promise.all(
				orders.map((order) => limit(() => this.upsertOrder(order)))
			);

			totalSynced += orders.length;

			if (orders.length < pageSize) break;
			page++;
		}

		this.logger.log(
			`BlueBox order incremental sync completed — ${totalSynced} orders synced`
		);
	}

	async enrichOrderStatus(blueboxId: number): Promise<void> {
		try {
			const status = await this.client.get<OrderStatus>(
				'/api/bluebox/order/status',
				{ id: blueboxId }
			);

			if (!status) return;

			await this.prisma.blueboxOrder.update({
				where: { blueboxId },
				data: {
					workflowStatus: status.workflowStatus,
					deliveryStatus: status.deliveryStatus,
					masterTracking: status.masterTracking,
				},
			});
		} catch (err) {
			this.logger.warn(`Failed to enrich status for order ${blueboxId}`, err);
		}
	}

	async syncOrderCheckpoints(
		orderId: string,
		blueboxId: number
	): Promise<void> {
		try {
			const checkpoints = await this.client.get<AftershipCheckpoint[]>(
				'/api/bluebox/order/checkpoints',
				{ id: blueboxId }
			);

			if (!checkpoints || checkpoints.length === 0) return;

			await this.prisma.blueboxOrderCheckpoint.deleteMany({
				where: { orderId },
			});

			for (const cp of checkpoints) {
				await this.prisma.blueboxOrderCheckpoint.create({
					data: {
						orderId,
						checkpointTime: cp.checkpoint_time
							? new Date(cp.checkpoint_time)
							: null,
						slug: cp.slug,
						location: cp.location,
						city: cp.city,
						state: cp.state,
						countryRegion: cp.country_region,
						zip: cp.zip,
						tag: cp.tag,
						message: cp.message,
						carrier: null,
					},
				});
			}
		} catch (err) {
			this.logger.warn(
				`Failed to sync checkpoints for order ${blueboxId}`,
				err
			);
		}
	}

	private async upsertOrder(order: RestOrder): Promise<void> {
		const dbOrder = await this.prisma.blueboxOrder.upsert({
			where: { blueboxId: order.id },
			update: {
				orderNumber: order.orderNumber,
				customerOrderNumber: order.customerOrderNumber,
				customerNumber: order.customerNumber,
				externalId: order.externalId,
				externalSource: order.externalSource,
				orderSource: order.orderSource,
				status: order.status,
				trackingNumber: order.trackingNumber,
				shippingCompany: order.shipping?.shippingCompany ?? null,
				shippingService: order.shipping?.shippingService ?? null,
				shippingCost: order.shippingCost,
				physicalWarehouse: order.physicalWarehouse,
				paymentStatus: order.payment?.status ?? null,
				paymentMethod: order.payment?.paymentMethod ?? null,
				paidAmount: order.payment?.paidAmount ?? null,
				discountAmount: order.discountAmount,
				taxAmount: order.taxAmount,
				memo: order.memo,
				poNumber: order.poNumber,
				isCanceled: order.isCanceled,
				isRushOrder: order.isRushOrder,
				dateOrderReceived: order.dateOrderReceived
					? new Date(order.dateOrderReceived)
					: null,
				dateOrderShipped: order.dateOrderShipped
					? new Date(order.dateOrderShipped)
					: null,
				dateOrderDelivered: order.dateOrderDelivered
					? new Date(order.dateOrderDelivered)
					: null,
				dateOrderPicked: order.dateOrderPicked
					? new Date(order.dateOrderPicked)
					: null,
				dateOrderPacked: order.dateOrderPacked
					? new Date(order.dateOrderPacked)
					: null,
				createDateTime: order.createDateTime
					? new Date(order.createDateTime)
					: null,
				shipToCompanyName: order.shipTo?.companyName ?? null,
				shipToFirstName: order.shipTo?.firstName ?? null,
				shipToLastName: order.shipTo?.lastName ?? null,
				shipToAddress1: order.shipTo?.address1 ?? null,
				shipToAddress2: order.shipTo?.address2 ?? null,
				shipToCity: order.shipTo?.city ?? null,
				shipToState: order.shipTo?.state ?? null,
				shipToZip: order.shipTo?.zip ?? null,
				shipToCountry: order.shipTo?.country ?? null,
				shipToPhone: order.shipTo?.phone ?? null,
				shipToEmail: order.shipTo?.email ?? null,
			},
			create: {
				blueboxId: order.id,
				orderNumber: order.orderNumber,
				customerOrderNumber: order.customerOrderNumber,
				customerNumber: order.customerNumber,
				externalId: order.externalId,
				externalSource: order.externalSource,
				orderSource: order.orderSource,
				status: order.status,
				trackingNumber: order.trackingNumber,
				shippingCompany: order.shipping?.shippingCompany ?? null,
				shippingService: order.shipping?.shippingService ?? null,
				shippingCost: order.shippingCost,
				physicalWarehouse: order.physicalWarehouse,
				paymentStatus: order.payment?.status ?? null,
				paymentMethod: order.payment?.paymentMethod ?? null,
				paidAmount: order.payment?.paidAmount ?? null,
				discountAmount: order.discountAmount,
				taxAmount: order.taxAmount,
				memo: order.memo,
				poNumber: order.poNumber,
				isCanceled: order.isCanceled,
				isRushOrder: order.isRushOrder,
				dateOrderReceived: order.dateOrderReceived
					? new Date(order.dateOrderReceived)
					: null,
				dateOrderShipped: order.dateOrderShipped
					? new Date(order.dateOrderShipped)
					: null,
				dateOrderDelivered: order.dateOrderDelivered
					? new Date(order.dateOrderDelivered)
					: null,
				dateOrderPicked: order.dateOrderPicked
					? new Date(order.dateOrderPicked)
					: null,
				dateOrderPacked: order.dateOrderPacked
					? new Date(order.dateOrderPacked)
					: null,
				createDateTime: order.createDateTime
					? new Date(order.createDateTime)
					: null,
				shipToCompanyName: order.shipTo?.companyName ?? null,
				shipToFirstName: order.shipTo?.firstName ?? null,
				shipToLastName: order.shipTo?.lastName ?? null,
				shipToAddress1: order.shipTo?.address1 ?? null,
				shipToAddress2: order.shipTo?.address2 ?? null,
				shipToCity: order.shipTo?.city ?? null,
				shipToState: order.shipTo?.state ?? null,
				shipToZip: order.shipTo?.zip ?? null,
				shipToCountry: order.shipTo?.country ?? null,
				shipToPhone: order.shipTo?.phone ?? null,
				shipToEmail: order.shipTo?.email ?? null,
			},
		});

		await Promise.allSettled([
			this.enrichOrderStatus(order.id),
			this.syncOrderCheckpoints(dbOrder.id, order.id),
			this.syncOrderItems(dbOrder.id, order),
		]);
	}

	private async syncOrderItems(
		orderId: string,
		order: RestOrder
	): Promise<void> {
		if (!order.items?.length) return;

		try {
			await this.prisma.$transaction([
				this.prisma.blueboxOrderItem.deleteMany({
					where: { orderId },
				}),
				this.prisma.blueboxOrderItem.createMany({
					data: order.items.map((item) => ({
						orderId,
						blueboxId: item.id,
						sku: item.sku ?? null,
						upc: item.upc ?? null,
						quantity: item.quantity ?? null,
						quantityCancelled: item.quantityCanceled ?? null,
						price: item.price ?? null,
						discountAmount: item.discountAmount ?? null,
						notes: item.notes ?? null,
						weight: item.weight ?? null,
						description: item.description ?? null,
						lot: item.requiredLotNumber ?? null,
					})),
				}),
			]);
		} catch (err) {
			this.logger.warn(`Failed to sync items for order ${order.id}`, err);
		}
	}
}
