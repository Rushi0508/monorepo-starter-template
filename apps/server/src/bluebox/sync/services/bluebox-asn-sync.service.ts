import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlueBoxClient } from '../../bluebox.client';

interface ExternalAsnItem {
	id: number;
	skuId: number;
	sku: string;
	upc: string | null;
	description: string | null;
	quantitySent: number;
	quantityDamaged: number;
	quantityReceived: number;
	quantityShelved: number;
	expiration: string | null;
	cost: number | null;
	carton: string | null;
	notes: string | null;
	lot: string | null;
	externalId: string | null;
	poNumber: string | null;
}

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

interface ExternalAsn {
	id: number;
	customerNumber: string | null;
	actualArriveDate: string | null;
	expectedDate: string | null;
	description: string | null;
	completeDate: string | null;
	countedDate: string | null;
	status: string | null;
	isExpedited: boolean;
	memo: string | null;
	notes: string | null;
	shipTo: RestOrderAddress | null;
	shipFrom: RestOrderAddress | null;
	items: ExternalAsnItem[];
	trackingNumber: string | null;
	shipper: string | null;
	warehouseCode: string | null;
	externalId: string | null;
	externalSource: string | null;
	longDescription: string | null;
	cartonCount: number | null;
	palletCount: number | null;
	additionalHandling: string | null;
}

@Injectable()
export class BlueboxAsnSyncService {
	private readonly logger = new Logger(BlueboxAsnSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly client: BlueBoxClient
	) {}

	async syncAsns(): Promise<void> {
		this.logger.log('Starting BlueBox ASN sync');

		let page = 1;
		const pageSize = 100;
		let totalSynced = 0;
		const limit = pLimit(5);

		const seenIds = new Set<number>();

		while (true) {
			const asns = await this.client.get<ExternalAsn[]>('/api/bluebox/asns', {
				page,
				pageSize,
			});

			if (!asns || asns.length === 0) break;

			for (const asn of asns) {
				seenIds.add(asn.id);
			}

			await Promise.all(asns.map((asn) => limit(() => this.upsertAsn(asn))));

			totalSynced += asns.length;

			if (asns.length < pageSize) break;
			page++;
		}

		await this.pruneAsns(seenIds);

		this.logger.log(`BlueBox ASN sync completed — ${totalSynced} ASNs synced`);
	}

	async syncUpdatedSince(since?: Date): Promise<void> {
		this.logger.log(`Syncing ASNs created since ${since?.toISOString()}`);

		let page = 1;
		const pageSize = 100;
		let totalSynced = 0;
		const limit = pLimit(5);

		while (true) {
			const asns = await this.client.get<ExternalAsn[]>('/api/bluebox/asns', {
				page,
				pageSize,
				...(since ? { minCreatedDate: since.toISOString() } : {}),
			});

			if (!asns || asns.length === 0) break;

			await Promise.all(asns.map((asn) => limit(() => this.upsertAsn(asn))));

			totalSynced += asns.length;

			if (asns.length < pageSize) break;
			page++;
		}

		this.logger.log(
			`BlueBox ASN incremental sync completed — ${totalSynced} ASNs synced`
		);
	}

	private async pruneAsns(seenIds: Set<number>): Promise<void> {
		if (seenIds.size === 0) {
			this.logger.warn('Skipping ASN cleanup — BlueBox returned no ASNs');
			return;
		}

		const { count } = await this.prisma.blueboxAsn.deleteMany({
			where: { blueboxId: { notIn: Array.from(seenIds) } },
		});

		if (count > 0) {
			this.logger.log(`Removed ${count} ASNs no longer in BlueBox`);
		}
	}

	private async upsertAsn(asn: ExternalAsn): Promise<void> {
		const dbAsn = await this.prisma.blueboxAsn.upsert({
			where: { blueboxId: asn.id },
			update: {
				customerNumber: asn.customerNumber,
				status: asn.status,
				description: asn.description,
				longDescription: asn.longDescription,
				expectedDate: asn.expectedDate ? new Date(asn.expectedDate) : null,
				actualArriveDate: asn.actualArriveDate
					? new Date(asn.actualArriveDate)
					: null,
				completeDate: asn.completeDate ? new Date(asn.completeDate) : null,
				countedDate: asn.countedDate ? new Date(asn.countedDate) : null,
				isExpedited: asn.isExpedited,
				memo: asn.memo,
				notes: asn.notes,
				trackingNumber: asn.trackingNumber,
				shipper: asn.shipper,
				warehouseCode: asn.warehouseCode,
				externalId: asn.externalId,
				externalSource: asn.externalSource,
				cartonCount: asn.cartonCount,
				palletCount: asn.palletCount,
				additionalHandling: asn.additionalHandling,
				...this.flattenAddress('shipTo', asn.shipTo),
				...this.flattenAddress('shipFrom', asn.shipFrom),
			},
			create: {
				blueboxId: asn.id,
				customerNumber: asn.customerNumber,
				status: asn.status,
				description: asn.description,
				longDescription: asn.longDescription,
				expectedDate: asn.expectedDate ? new Date(asn.expectedDate) : null,
				actualArriveDate: asn.actualArriveDate
					? new Date(asn.actualArriveDate)
					: null,
				completeDate: asn.completeDate ? new Date(asn.completeDate) : null,
				countedDate: asn.countedDate ? new Date(asn.countedDate) : null,
				isExpedited: asn.isExpedited,
				memo: asn.memo,
				notes: asn.notes,
				trackingNumber: asn.trackingNumber,
				shipper: asn.shipper,
				warehouseCode: asn.warehouseCode,
				externalId: asn.externalId,
				externalSource: asn.externalSource,
				cartonCount: asn.cartonCount,
				palletCount: asn.palletCount,
				additionalHandling: asn.additionalHandling,
				...this.flattenAddress('shipTo', asn.shipTo),
				...this.flattenAddress('shipFrom', asn.shipFrom),
			},
		});

		await this.syncAsnItems(dbAsn.id, asn.items);
	}

	private async syncAsnItems(
		asnId: string,
		items: ExternalAsnItem[] | undefined
	): Promise<void> {
		// An omitted `items` means the payload didn't carry them; an empty array
		// means the ASN genuinely has none. Only the latter should clear the rows.
		if (!items) return;

		const seenIds = new Set<number>();

		for (const item of items) {
			seenIds.add(item.id);
		}

		const { count } = await this.prisma.blueboxAsnItem.deleteMany({
			where: {
				asnId,
				// A null blueboxId can never match an incoming item, and SQL's NOT IN
				// would skip it, so those rows are pruned explicitly.
				OR: [
					{ blueboxId: null },
					{ blueboxId: { notIn: Array.from(seenIds) } },
				],
			},
		});

		if (count > 0) {
			this.logger.log(`Removed ${count} ASN items no longer in BlueBox`);
		}

		for (const item of items) {
			const existing = await this.prisma.blueboxAsnItem.findFirst({
				where: { asnId, blueboxId: item.id },
				select: { id: true },
			});

			const data = {
				skuId: item.skuId,
				sku: item.sku,
				upc: item.upc,
				description: item.description,
				quantitySent: item.quantitySent,
				quantityDamaged: item.quantityDamaged,
				quantityReceived: item.quantityReceived,
				quantityShelved: item.quantityShelved,
				expiration: item.expiration ? new Date(item.expiration) : null,
				cost: item.cost,
				carton: item.carton,
				notes: item.notes,
				lot: item.lot,
				externalId: item.externalId,
				poNumber: item.poNumber,
			};

			if (existing) {
				await this.prisma.blueboxAsnItem.update({
					where: { id: existing.id },
					data,
				});
			} else {
				await this.prisma.blueboxAsnItem.create({
					data: { asnId, blueboxId: item.id, ...data },
				});
			}
		}
	}

	private flattenAddress(
		prefix: 'shipTo' | 'shipFrom',
		address: RestOrderAddress | null
	): Record<string, string | null> {
		if (!address) return {};
		return {
			[`${prefix}CompanyName`]: address.companyName,
			[`${prefix}FirstName`]: address.firstName,
			[`${prefix}LastName`]: address.lastName,
			[`${prefix}Address1`]: address.address1,
			[`${prefix}Address2`]: address.address2,
			[`${prefix}City`]: address.city,
			[`${prefix}State`]: address.state,
			[`${prefix}Zip`]: address.zip,
			[`${prefix}Country`]: address.country,
			[`${prefix}Phone`]: address.phone,
			[`${prefix}Email`]: address.email,
		};
	}
}
