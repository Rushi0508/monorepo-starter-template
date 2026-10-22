import type {
	GetAsnsResponseType,
	GetInventoryResponseType,
	GetInventorySummaryResponseType,
	GetKitOrdersResponseType,
	GetProductionRunsResponseType,
	InventoryBreakdownRow,
	InventoryLocationType,
	InventorySkuRow,
	KitOrderItem,
	ReplenishmenOrdersResponseType,
} from '@repo/types';
import { capArray, omitNulls, pageWithMeta, round2 } from '../../lib/shape.js';
import {
	ASN_CAP,
	CROSS_WAREHOUSE_CAP,
	EXPIRING_DEFAULT_DAYS,
	KIT_ORDER_CAP,
	LOW_STOCK_THRESHOLD,
	MB_REPLENISHMENT_CAP,
	MB_STOCK_CAP,
	type PageOpts,
	PRODUCTION_CAP,
	STOCK_CAP,
} from './schema.js';

function matchesSku(rowSku: string, filter?: string): boolean {
	if (!filter) return true;
	return rowSku.toLowerCase() === filter.toLowerCase();
}

function resolvePage(opts: PageOpts | undefined, defaultLimit: number) {
	return {
		page: opts?.page ?? 1,
		limit: opts?.limit ?? defaultLimit,
	};
}

export function shapeStockRows(
	rows: InventorySkuRow[],
	opts: {
		sku?: string;
		includeDetail?: boolean;
		expiringWithinDays?: number;
	} = {}
): Record<string, unknown>[] {
	const filtered = rows.filter((r) => matchesSku(r.sku, opts.sku));
	const expiringDays = opts.expiringWithinDays;
	const includeLots =
		opts.includeDetail === true ||
		(expiringDays !== undefined && expiringDays !== null);

	const shaped = filtered.map((r) => {
		let lots = r.lots;
		if (expiringDays !== undefined && expiringDays !== null) {
			lots = lots.filter(
				(l) =>
					l.daysToExpiry !== null &&
					l.daysToExpiry !== undefined &&
					l.daysToExpiry <= expiringDays
			);
		}

		return omitNulls({
			sku: r.sku,
			description: r.description,
			onHand: r.onHand,
			committed: r.committed,
			available: r.available,
			backordered: r.backordered,
			quarantined: r.quarantined,
			earliestExpiry: r.earliestExpiry,
			lots: includeLots
				? lots.map((l) =>
						omitNulls({
							lotNumber: l.lotNumber,
							location: l.location,
							qty: l.qty,
							expirationDate: l.expirationDate,
							daysToExpiry: l.daysToExpiry,
						})
					)
				: undefined,
		});
	});

	// List mode: only SKUs with matching lots. Sku lookup keeps the row.
	if (expiringDays !== undefined && expiringDays !== null && !opts.sku) {
		return shaped.filter(
			(row) => Array.isArray(row.lots) && row.lots.length > 0
		);
	}

	return shaped;
}

export function shapeInventorySummary(opts: {
	inventory: GetInventoryResponseType;
	asns: GetAsnsResponseType;
	production: GetProductionRunsResponseType;
	mbStock: InventoryLocationType[];
	mbReplenishment: ReplenishmenOrdersResponseType;
}) {
	const { inventory, asns, production, mbStock, mbReplenishment } = opts;
	const lowStock = inventory.data.filter(
		(r) => r.available <= LOW_STOCK_THRESHOLD
	).length;
	const expiring = inventory.data.filter((r) =>
		r.lots?.some(
			(l) =>
				l.daysToExpiry !== null &&
				l.daysToExpiry !== undefined &&
				l.daysToExpiry <= EXPIRING_DEFAULT_DAYS
		)
	).length;
	const openAsns = asns.data.filter(
		(a) =>
			a.status &&
			!['COMPLETE', 'COMPLETED', 'CLOSED'].includes(a.status.toUpperCase())
	).length;
	const latest = capArray(production.data, 3).map((p) =>
		omitNulls({
			runNumber: p.runNumber,
			sku: p.sku,
			productionDate: p.productionDate,
			lotNumber: p.lotNumber,
			quantity: p.quantity,
		})
	);

	const mbSkus = new Set(mbStock.map((r) => r.sku));
	const mbAvailable = mbStock.reduce((sum, r) => sum + (r.available ?? 0), 0);
	const mbLowStockCount = mbStock.filter(
		(r) => r.available <= LOW_STOCK_THRESHOLD
	).length;
	const openReplenishmentCount = mbReplenishment.filter(
		(o) => o.isProcessed === false
	).length;

	return {
		totals: inventory.totals,
		skuCount: inventory.data.length,
		lowStockCount: lowStock,
		expiringWithin60Days: expiring,
		openAsnCount: openAsns,
		asnTotalCount: asns.totalCount,
		productionRunCount: production.totalCount,
		latestProduction: latest,
		mbSkuCount: mbSkus.size,
		mbAvailable,
		mbLowStockCount,
		openReplenishmentCount,
		replenishmentTotalCount: mbReplenishment.length,
	};
}

export function shapeBlueboxStock(
	inventory: GetInventoryResponseType,
	opts: {
		sku?: string;
		includeDetail?: boolean;
		expiringWithinDays?: number;
	} & PageOpts = {}
) {
	const rows = shapeStockRows(inventory.data, opts);
	const { page, limit } = resolvePage(opts, STOCK_CAP);
	const paged = pageWithMeta(rows, page, limit);
	const row = paged.items[0];
	const hasLots =
		Array.isArray(row?.lots) && (row.lots as unknown[]).length > 0;

	return omitNulls({
		totals: opts.sku ? undefined : inventory.totals,
		skus: paged.items,
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
		note:
			opts.sku &&
			opts.expiringWithinDays != null &&
			paged.items.length > 0 &&
			!hasLots
				? `No lots expiring within ${opts.expiringWithinDays}d`
				: undefined,
	});
}

export function shapeBlueboxInbound(
	asns: GetAsnsResponseType,
	opts: { sku?: string; includeDetail?: boolean } & PageOpts = {}
) {
	let filtered = asns.data;
	if (opts.sku) {
		const skuLower = opts.sku.toLowerCase();
		filtered = filtered.filter(
			(a) =>
				a.sku?.toLowerCase() === skuLower ||
				a.packages?.some((p) => p.sku?.toLowerCase() === skuLower)
		);
	}
	const { page, limit } = resolvePage(opts, ASN_CAP);
	const paged = pageWithMeta(filtered, page, limit);

	return omitNulls({
		asns: paged.items.map((a) =>
			omitNulls({
				asnNumber: a.asnNumber,
				sku: a.sku,
				status: a.status,
				poNumber: a.poNumber,
				expectedDate: a.expectedDate,
				actualDate: a.actualDate,
				sent: a.sent,
				received: a.received,
				damaged: a.damaged,
				shelved: a.shelved,
				carrier: a.carrier,
				trackingNumber: a.trackingNumber,
				packages: opts.includeDetail
					? a.packages?.map((p) =>
							omitNulls({
								sku: p.sku,
								lot: p.lot,
								quantitySent: p.quantitySent,
								quantityReceived: p.quantityReceived,
								quantityDamaged: p.quantityDamaged,
								quantityShelved: p.quantityShelved,
							})
						)
					: undefined,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

export function shapeBlueboxProduction(
	production: GetProductionRunsResponseType,
	opts: { sku?: string } & PageOpts = {}
) {
	let filtered = production.data;
	if (opts.sku) {
		const skuLower = opts.sku.toLowerCase();
		filtered = filtered.filter((p) => p.sku.toLowerCase() === skuLower);
	}
	const { page, limit } = resolvePage(opts, PRODUCTION_CAP);
	const paged = pageWithMeta(filtered, page, limit);

	return omitNulls({
		productionRuns: paged.items.map((p) =>
			omitNulls({
				runNumber: p.runNumber,
				sku: p.sku,
				productionDate: p.productionDate,
				lotNumber: p.lotNumber,
				quantity: p.quantity,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

export function shapeMbStock(
	rows: InventoryLocationType[],
	opts: { sku?: string } & PageOpts = {}
) {
	const filtered = opts.sku
		? rows.filter((r) => matchesSku(r.sku, opts.sku))
		: rows;
	const { page, limit } = resolvePage(opts, MB_STOCK_CAP);
	const paged = pageWithMeta(filtered, page, limit);

	return omitNulls({
		locations: paged.items.map((r) =>
			omitNulls({
				sku: r.sku,
				description: r.description,
				locationName: r.locationName,
				available: r.available,
				onHand: r.onHand,
				committed: r.committed,
				incoming: r.incoming,
				reserved: r.reserved,
				damaged: r.damaged,
				safetyStock: r.safetyStock,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

export function shapeMbReplenishment(
	rows: ReplenishmenOrdersResponseType,
	opts: { sku?: string } & PageOpts = {}
) {
	let filtered = rows;
	if (opts.sku) {
		const skuLower = opts.sku.toLowerCase();
		filtered = rows.filter((o) =>
			o.items?.some((i) => i.sku.toLowerCase() === skuLower)
		);
	}
	const { page, limit } = resolvePage(opts, MB_REPLENISHMENT_CAP);
	const paged = pageWithMeta(filtered, page, limit);

	return omitNulls({
		orders: paged.items.map((o) =>
			omitNulls({
				orderNumber: o.orderNumber,
				blueboxStatus: o.blueboxStatus,
				pickupDate: o.pickupDate,
				isProcessed: o.isProcessed,
				emailSentAt: o.emailSentAt,
				emailAcknowledgedAt: o.emailAcknowledgedAt,
				pickupConfirmedAt: o.pickupConfirmedAt,
				items: o.items?.map((i) =>
					omitNulls({ sku: i.sku, quantity: i.quantity })
				),
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function shapeBreakdownRow(
	row: InventoryBreakdownRow,
	includeDetail: boolean
): Record<string, unknown> {
	return omitNulls({
		key: row.key,
		label: row.label,
		onHand: row.onHand,
		available: row.available,
		committed: row.committed,
		value: round2(row.value),
		valueShare: round2(row.valueShare),
		children: includeDetail
			? row.children?.map((child) => shapeBreakdownRow(child, false))
			: undefined,
	});
}

export function shapeCrossWarehouseSummary(
	summary: GetInventorySummaryResponseType,
	opts: { includeDetail?: boolean } & PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, CROSS_WAREHOUSE_CAP);
	const paged = pageWithMeta(summary.breakdown, page, limit);
	const includeDetail = Boolean(opts.includeDetail);
	return omitNulls({
		totals: {
			onHand: summary.totals.onHand,
			available: summary.totals.available,
			committed: summary.totals.committed,
			value: round2(summary.totals.value),
		},
		breakdownBy: summary.breakdownBy,
		breakdown: paged.items.map((row) => shapeBreakdownRow(row, includeDetail)),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function shapeKitOrder(order: KitOrderItem, includeDetail: boolean) {
	return omitNulls({
		kitOrderNumber: order.kitOrderNumber,
		kitDescription: order.kitDescription,
		sku: order.sku,
		status: order.status,
		workflowStep: order.workflowStep,
		warehouse: order.warehouse,
		quantity: order.quantity,
		quantityBuilt: order.quantityBuilt,
		percentComplete: order.percentComplete,
		billableCost: round2(order.billableCost),
		createdDate: order.createdDate,
		requestedDate: order.requestedDate,
		completedDate: order.completedDate,
		canceledDate: order.canceledDate,
		finalItems: includeDetail
			? order.finalItems.map((item) =>
					omitNulls({
						sku: item.sku,
						description: item.description,
						quantity: item.quantity,
						quantityBuilt: item.quantityBuilt,
					})
				)
			: undefined,
		rawItems: includeDetail
			? order.rawItems.map((item) =>
					omitNulls({
						sku: item.sku,
						description: item.description,
						quantity: item.quantity,
						quantityReserved: item.quantityReserved,
						quantityConsumed: item.quantityConsumed,
						requiredLotNumber: item.requiredLotNumber,
					})
				)
			: undefined,
	});
}

export function shapeBlueboxKitOrders(
	kitOrders: GetKitOrdersResponseType,
	opts: { sku?: string; includeDetail?: boolean } & PageOpts = {}
) {
	let filtered = kitOrders.data;
	if (opts.sku) {
		const skuLower = opts.sku.toLowerCase();
		filtered = filtered.filter(
			(order) =>
				order.sku?.toLowerCase() === skuLower ||
				order.finalItems.some((item) => item.sku.toLowerCase() === skuLower) ||
				order.rawItems.some((item) => item.sku.toLowerCase() === skuLower)
		);
	}
	const { page, limit } = resolvePage(opts, KIT_ORDER_CAP);
	const paged = pageWithMeta(filtered, page, limit);
	const includeDetail = Boolean(opts.includeDetail);
	return omitNulls({
		kitOrders: paged.items.map((order) => shapeKitOrder(order, includeDetail)),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}
