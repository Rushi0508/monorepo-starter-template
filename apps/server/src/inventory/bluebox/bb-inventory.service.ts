import { Injectable, NotFoundException } from '@nestjs/common';
import { ASNStatusEnum, KitOrderStatusEnum } from '@repo/enums';
import type {
	AsnItem,
	CreateProductionRunInput,
	GetAsnsResponseType,
	GetInventoryResponseType,
	GetKitOrdersResponseType,
	GetProductionRunsResponseType,
	InProductionBreakdown,
	InProductionSource,
	InventoryLot,
	InventorySkuRow,
	KitOrderItem,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog, type SkuCatalog } from 'src/sku/sku-catalog';

const normalize = (value: string) => value.trim().toLowerCase();

const emptyBreakdown = (): InProductionBreakdown => ({
	total: 0,
	runs: 0,
	asns: 0,
	kitting: 0,
	sources: [],
});

@Injectable()
export class BlueboxInventoryService {
	constructor(private readonly prisma: PrismaService) {}

	async getInventory(): Promise<GetInventoryResponseType> {
		const now = new Date();

		// ── 1. Aggregate BlueboxInventory by SKU ──────────────────────────────────
		const [inventoryRows, catalog] = await Promise.all([
			this.prisma.blueboxInventory.findMany(),
			loadSkuCatalog(this.prisma),
		]);

		const inventoryBySku = new Map<
			string,
			{
				description: string | null;
				onHand: number;
				committed: number;
				available: number;
				backordered: number;
				quarantined: number;
			}
		>();
		for (const row of inventoryRows) {
			const sku = catalog.canonical(row.sku);
			const existing = inventoryBySku.get(sku);
			inventoryBySku.set(sku, {
				description: existing?.description ?? row.description ?? null,
				onHand: (existing?.onHand ?? 0) + (row.onHand ?? 0),
				committed: (existing?.committed ?? 0) + (row.committed ?? 0),
				available: (existing?.available ?? 0) + (row.available ?? 0),
				backordered: (existing?.backordered ?? 0) + (row.backordered ?? 0),
				quarantined: (existing?.quarantined ?? 0) + (row.quarantined ?? 0),
			});
		}

		// ── 2. Lot breakdown by SKU ───────────────────────────────────────────────
		const lotRows = await this.prisma.blueboxInventoryByLot.findMany({
			orderBy: { expirationDate: 'asc' },
		});

		const lotsBySku = new Map<string, InventoryLot[]>();
		for (const row of lotRows) {
			const daysToExpiry = row.expirationDate
				? Math.round(
						(row.expirationDate.getTime() - now.getTime()) /
							(1000 * 60 * 60 * 24)
					)
				: null;

			const lot: InventoryLot = {
				lotNumber: row.lotNumber,
				location: row.warehouseCode || 'Unknown',
				qty: row.qty ?? 0,
				expirationDate: row.expirationDate?.toISOString() ?? null,
				daysToExpiry,
			};

			const sku = catalog.canonical(row.sku);
			const existing = lotsBySku.get(sku) ?? [];
			existing.push(lot);
			lotsBySku.set(sku, existing);
		}

		// ── 3. In production (runs + open ASNs + open kit orders) ─────────────────
		// A SKU that is only in production (e.g. a brand-new can) still gets a row.
		const inProductionBySku = await this.loadInProduction(catalog);

		const skus = new Map(
			Array.from(inventoryBySku.keys()).map((sku) => [normalize(sku), sku])
		);
		for (const [key, { sku }] of inProductionBySku) {
			if (!skus.has(key)) skus.set(key, sku);
		}

		// ── 4. Assemble SKU rows ──────────────────────────────────────────────────
		const data: InventorySkuRow[] = [];

		for (const [key, sku] of Array.from(skus).sort(([, a], [, b]) =>
			a.localeCompare(b)
		)) {
			const inv = inventoryBySku.get(sku);
			const lots = lotsBySku.get(sku) ?? [];
			const earliestExpiry =
				lots.find((l) => l.expirationDate != null)?.expirationDate ?? null;
			const inProduction = inProductionBySku.get(key)?.breakdown;

			data.push({
				sku,
				description: catalog.resolve(sku)?.title ?? inv?.description ?? null,
				onHand: inv?.onHand ?? 0,
				committed: inv?.committed ?? 0,
				available: inv?.available ?? 0,
				backordered: inv?.backordered ?? 0,
				quarantined: inv?.quarantined ?? 0,
				inProduction: inProduction ?? emptyBreakdown(),
				earliestExpiry,
				lots,
			});
		}

		// ── 5. Totals ─────────────────────────────────────────────────────────────
		const totals = data.reduce(
			(acc, row) => ({
				onHand: acc.onHand + row.onHand,
				committed: acc.committed + row.committed,
				available: acc.available + row.available,
				backordered: acc.backordered + row.backordered,
				quarantined: acc.quarantined + row.quarantined,
				inProduction: acc.inProduction + row.inProduction.total,
			}),
			{
				onHand: 0,
				committed: 0,
				available: 0,
				backordered: 0,
				quarantined: 0,
				inProduction: 0,
			}
		);

		return { data, totals };
	}

	// ── ASN list (full detail included, no pagination) ──────────────────────────

	async getAsns(): Promise<GetAsnsResponseType> {
		const asns = await this.prisma.blueboxAsn.findMany({
			orderBy: { expectedDate: 'desc' },
			include: { items: { orderBy: { carton: 'asc' } } },
		});

		const data: AsnItem[] = asns.map((asn) => {
			const sent = asn.items.reduce((s, i) => s + (i.quantitySent ?? 0), 0);
			const received = asn.items.reduce(
				(s, i) => s + (i.quantityReceived ?? 0),
				0
			);
			const damaged = asn.items.reduce(
				(s, i) => s + (i.quantityDamaged ?? 0),
				0
			);
			const shelved = asn.items.reduce(
				(s, i) => s + (i.quantityShelved ?? 0),
				0
			);

			const skus = [...new Set(asn.items.map((i) => i.sku).filter(Boolean))];
			const poNumbers = [
				...new Set(asn.items.map((i) => i.poNumber).filter(Boolean)),
			];

			return {
				id: asn.id,
				asnNumber: asn.blueboxId.toString(),
				description: asn.description,
				warehouseCode: asn.warehouseCode,
				status: asn.status,
				poNumber: poNumbers[0] ?? null,
				sku: skus.length === 1 ? skus[0]! : skus.length > 1 ? 'Multiple' : null,
				externalId: asn.externalId,
				carrier: asn.shipper,
				trackingNumber: asn.trackingNumber,
				expectedDate: asn.expectedDate?.toISOString() ?? null,
				actualDate: asn.actualArriveDate?.toISOString() ?? null,
				sent,
				received,
				damaged,
				shelved,
				packages: asn.items.map((item) => ({
					id: item.id,
					sku: item.sku,
					lot: item.lot,
					quantitySent: item.quantitySent ?? 0,
					quantityReceived: item.quantityReceived ?? 0,
					quantityDamaged: item.quantityDamaged ?? 0,
					quantityShelved: item.quantityShelved ?? 0,
				})),
				notes: asn.notes,
			};
		});

		return { data, totalCount: data.length };
	}

	// ── Production Runs ──────────────────────────────────────────────────────────

	async getProductionRuns(): Promise<GetProductionRunsResponseType> {
		const runs = await this.prisma.productionRun.findMany({
			orderBy: { runNumber: 'desc' },
		});

		return { data: runs, totalCount: runs.length };
	}

	async createProductionRun(input: CreateProductionRunInput) {
		// Numbered from the highest existing run, not the row count, so deleting a
		// run can't hand out a number that is still taken.
		const latest = await this.prisma.productionRun.findFirst({
			orderBy: { runNumber: 'desc' },
			select: { runNumber: true },
		});
		const next = Number(latest?.runNumber.replace(/\D/g, '') ?? 0) + 1;
		const runNumber = `PR-${String(next).padStart(6, '0')}`;

		await this.prisma.productionRun.create({
			data: {
				runNumber,
				sku: input.sku,
				productionDate: new Date(input.productionDate),
				lotNumber: input.lotNumber,
				quantity: input.quantity,
			},
		});

		return { message: 'Production run created successfully' };
	}

	async setProductionRunCompleted(id: string, completed: boolean) {
		await this.findProductionRun(id);

		await this.prisma.productionRun.update({
			where: { id },
			data: { completedAt: completed ? new Date() : null },
		});

		return {
			message: completed
				? 'Production run marked complete'
				: 'Production run reopened',
		};
	}

	async deleteProductionRun(id: string) {
		await this.findProductionRun(id);
		await this.prisma.productionRun.delete({ where: { id } });

		return { message: 'Production run deleted' };
	}

	private async findProductionRun(id: string) {
		const run = await this.prisma.productionRun.findUnique({ where: { id } });
		if (!run) throw new NotFoundException('Production run not found');
		return run;
	}

	// ── Kit Orders ───────────────────────────────────────────────────────────────

	async getKitOrders(): Promise<GetKitOrdersResponseType> {
		const orders = await this.prisma.blueboxKitOrder.findMany({
			orderBy: { createdDate: 'desc' },
			include: {
				finalItems: { orderBy: { sku: 'asc' } },
				rawItems: { orderBy: { sku: 'asc' } },
			},
		});

		const data: KitOrderItem[] = orders.map((order) => {
			const skus = [...new Set(order.finalItems.map((i) => i.sku))];

			return {
				id: order.id,
				kitOrderNumber: order.blueboxId.toString(),
				kitDescription: order.kitDescription,
				sku: skus.length === 1 ? skus[0]! : skus.length > 1 ? 'Multiple' : null,
				status: order.canceledDate
					? KitOrderStatusEnum.CANCELED
					: order.completedDate
						? KitOrderStatusEnum.COMPLETED
						: KitOrderStatusEnum.OPEN,
				workflowStep: order.workflowStep,
				warehouse: order.physicalWarehouseName,
				quantity: order.quantity,
				quantityBuilt: order.quantityBuilt,
				percentComplete: order.percentComplete ?? 0,
				billableCost: order.billableCost,
				createdDate: order.createdDate?.toISOString() ?? null,
				requestedDate: order.requestedDate?.toISOString() ?? null,
				completedDate: order.completedDate?.toISOString() ?? null,
				canceledDate: order.canceledDate?.toISOString() ?? null,
				finalItems: order.finalItems.map((item) => ({
					id: item.id,
					sku: item.sku,
					description: item.description,
					quantity: item.quantity,
					quantityBuilt: item.quantityBuilt,
				})),
				rawItems: order.rawItems.map((item) => ({
					id: item.id,
					sku: item.sku,
					description: item.description,
					quantity: item.quantity,
					quantityReserved: item.quantityReserved,
					quantityConsumed: item.quantityConsumed,
					requiredLotNumber: item.requiredLotNumber,
				})),
			};
		});

		return { data, totalCount: data.length };
	}

	// ── In production ────────────────────────────────────────────────────────────

	/**
	 * A production run counts until an ASN carrying its SKU and lot takes over;
	 * from then on only the unshipped remainder counts, so no unit is counted
	 * both as a run and as an inbound ASN.
	 */
	private async loadInProduction(
		catalog: SkuCatalog
	): Promise<Map<string, { sku: string; breakdown: InProductionBreakdown }>> {
		const [asnItems, productionRuns, kitOrders] = await Promise.all([
			this.prisma.blueboxAsnItem.findMany({
				select: {
					sku: true,
					lot: true,
					quantitySent: true,
					quantityReceived: true,
					asn: {
						select: { blueboxId: true, status: true, expectedDate: true },
					},
				},
			}),
			this.prisma.productionRun.findMany({ orderBy: { runNumber: 'desc' } }),
			this.prisma.blueboxKitOrder.findMany({
				where: { completedDate: null, canceledDate: null },
				select: {
					blueboxId: true,
					requestedDate: true,
					finalItems: {
						select: { sku: true, quantity: true, quantityBuilt: true },
					},
				},
			}),
		]);

		const bySku = new Map<
			string,
			{ sku: string; breakdown: InProductionBreakdown }
		>();
		const add = (
			sku: string,
			bucket: 'runs' | 'asns' | 'kitting',
			source: InProductionSource
		) => {
			if (source.quantity <= 0) return;
			const current = catalog.canonical(sku);
			const key = normalize(current);
			const entry = bySku.get(key) ?? {
				sku: current,
				breakdown: emptyBreakdown(),
			};
			entry.breakdown[bucket] += source.quantity;
			entry.breakdown.total += source.quantity;
			entry.breakdown.sources.push(source);
			bySku.set(key, entry);
		};

		const isAsnOpen = (status: string | null) =>
			status !== ASNStatusEnum.COMPLETED;

		for (const item of asnItems) {
			if (!isAsnOpen(item.asn.status)) continue;
			add(item.sku, 'asns', {
				type: 'asn',
				reference: `ASN #${item.asn.blueboxId}`,
				lot: item.lot,
				quantity: Math.max(
					0,
					(item.quantitySent ?? 0) - (item.quantityReceived ?? 0)
				),
				date: item.asn.expectedDate?.toISOString() ?? null,
			});
		}

		const lotKey = (sku: string, lot: string) =>
			`${normalize(catalog.canonical(sku))}|${normalize(lot)}`;

		const asnItemsByLot = new Map<string, typeof asnItems>();
		for (const item of asnItems) {
			if (item.lot == null) continue;
			const key = lotKey(item.sku, item.lot);
			asnItemsByLot.set(key, [...(asnItemsByLot.get(key) ?? []), item]);
		}

		// Runs sharing a SKU + lot split what the ASNs shipped, oldest run first,
		// so one ASN line is never subtracted from several runs.
		const unallocated = new Map(
			Array.from(asnItemsByLot, ([key, items]) => [
				key,
				items.reduce((s, i) => s + (i.quantitySent ?? 0), 0),
			])
		);
		const shippedByRun = new Map<string, number>();
		for (const run of [...productionRuns].sort(
			(a, b) =>
				a.productionDate.getTime() - b.productionDate.getTime() ||
				a.runNumber.localeCompare(b.runNumber)
		)) {
			const key = lotKey(run.sku, run.lotNumber);
			const available = unallocated.get(key) ?? 0;
			const shipped = Math.min(run.quantity, available);
			unallocated.set(key, available - shipped);
			shippedByRun.set(run.id, shipped);
		}

		// Once every ASN carrying a run is Completed, whatever wasn't shipped is
		// treated as short-shipped rather than still in production. Runs that never
		// reach an ASN are closed by hand.
		for (const run of productionRuns) {
			const matched = asnItemsByLot.get(lotKey(run.sku, run.lotNumber)) ?? [];
			const closed =
				run.completedAt != null ||
				(matched.length > 0 && matched.every((i) => !isAsnOpen(i.asn.status)));

			add(run.sku, 'runs', {
				type: 'run',
				reference: run.runNumber,
				lot: run.lotNumber,
				quantity: closed ? 0 : run.quantity - (shippedByRun.get(run.id) ?? 0),
				date: run.productionDate.toISOString(),
			});
		}

		for (const order of kitOrders) {
			for (const item of order.finalItems) {
				add(item.sku, 'kitting', {
					type: 'kit',
					reference: `Kit #${order.blueboxId}`,
					lot: null,
					quantity: Math.max(0, item.quantity - item.quantityBuilt),
					date: order.requestedDate?.toISOString() ?? null,
				});
			}
		}

		return bySku;
	}
}
