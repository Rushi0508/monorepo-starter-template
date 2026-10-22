import { Injectable, Logger } from '@nestjs/common';
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

interface RestOrderInShipment {
	id: number;
	orderNumber: string | null;
	customerOrderNumber: string | null;
	externalId: string | null;
	externalSource: string | null;
	status: string | null;
	trackingNumber: string | null;
	shippingCost: number | null;
	dateOrderShipped: string | null;
	dateOrderDelivered: string | null;
	dateOrderReceived: string | null;
	shipTo: RestOrderAddress | null;
	shipping: RestOrderShipping | null;
}

interface RestOrderOutboundShipment {
	shipmentId: string;
	created: string | null;
	readyForLabels: boolean;
	orders: RestOrderInShipment[];
}

@Injectable()
export class BlueboxShipmentSyncService {
	private readonly logger = new Logger(BlueboxShipmentSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly client: BlueBoxClient
	) {}

	async syncShipments(): Promise<void> {
		this.logger.log('Starting BlueBox outbound shipment sync');

		const shipments = await this.client.get<RestOrderOutboundShipment[]>(
			'/api/bluebox/order/outboundShipments'
		);

		if (!shipments || shipments.length === 0) {
			this.logger.log('No outbound shipments found');
			return;
		}

		const seenIds = new Set<string>();

		for (const shipment of shipments) {
			await this.upsertShipment(shipment);
			seenIds.add(shipment.shipmentId);
		}

		await this.pruneShipments(seenIds);

		this.logger.log(
			`BlueBox outbound shipment sync completed — ${shipments.length} shipments synced`
		);
	}

	async syncUpdatedSince(since?: Date): Promise<void> {
		this.logger.log(
			`Syncing outbound shipments created since ${since?.toISOString()}`
		);

		const shipments = await this.client.get<RestOrderOutboundShipment[]>(
			'/api/bluebox/order/outboundShipments',
			{ ...(since ? { minCreatedDate: since.toISOString() } : {}) }
		);

		if (!shipments || shipments.length === 0) {
			this.logger.log('No new outbound shipments found');
			return;
		}

		for (const shipment of shipments) {
			await this.upsertShipment(shipment);
		}

		this.logger.log(
			`BlueBox outbound shipment incremental sync completed — ${shipments.length} shipments synced`
		);
	}

	private async pruneShipments(seenIds: Set<string>): Promise<void> {
		const { count } = await this.prisma.blueboxOutboundShipment.deleteMany({
			where: { shipmentId: { notIn: Array.from(seenIds) } },
		});

		if (count > 0) {
			this.logger.log(`Removed ${count} shipments no longer in BlueBox`);
		}
	}

	private async upsertShipment(
		shipment: RestOrderOutboundShipment
	): Promise<void> {
		const dbShipment = await this.prisma.blueboxOutboundShipment.upsert({
			where: { shipmentId: shipment.shipmentId },
			update: {
				created: shipment.created ? new Date(shipment.created) : null,
				readyForLabels: shipment.readyForLabels,
			},
			create: {
				shipmentId: shipment.shipmentId,
				created: shipment.created ? new Date(shipment.created) : null,
				readyForLabels: shipment.readyForLabels,
			},
		});

		await this.prisma.blueboxOutboundShipmentOrder.deleteMany({
			where: { shipmentId: dbShipment.id },
		});

		for (const order of shipment.orders ?? []) {
			await this.prisma.blueboxOutboundShipmentOrder.create({
				data: {
					shipmentId: dbShipment.id,
					blueboxOrderId: order.id,
					orderNumber: order.orderNumber,
					customerOrderNumber: order.customerOrderNumber,
					externalId: order.externalId,
					externalSource: order.externalSource,
					status: order.status,
					trackingNumber: order.trackingNumber,
					shippingCompany: order.shipping?.shippingCompany ?? null,
					shippingService: order.shipping?.shippingService ?? null,
					shippingCost: order.shippingCost,
					dateOrderShipped: order.dateOrderShipped
						? new Date(order.dateOrderShipped)
						: null,
					dateOrderDelivered: order.dateOrderDelivered
						? new Date(order.dateOrderDelivered)
						: null,
					dateOrderReceived: order.dateOrderReceived
						? new Date(order.dateOrderReceived)
						: null,
					shipToFirstName: order.shipTo?.firstName ?? null,
					shipToLastName: order.shipTo?.lastName ?? null,
					shipToAddress1: order.shipTo?.address1 ?? null,
					shipToAddress2: order.shipTo?.address2 ?? null,
					shipToCity: order.shipTo?.city ?? null,
					shipToState: order.shipTo?.state ?? null,
					shipToZip: order.shipTo?.zip ?? null,
					shipToCountry: order.shipTo?.country ?? null,
				},
			});
		}
	}
}
