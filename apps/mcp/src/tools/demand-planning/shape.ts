import type {
	DemandAccuracyType,
	DemandComparisonRowType,
	DemandComparisonType,
	DemandForecastMethodType,
	DemandGridCellType,
	DemandGridType,
	DemandPlanAuditType,
	DemandPlanListItemType,
	DemandPlanPricingType,
	DemandPlanType,
	DemandScenarioListItemType,
	GetDemandAccuracyResponseType,
} from '@repo/types';
import {
	capWithMeta,
	omitNulls,
	pageWithMeta,
	round2,
} from '../../lib/shape.js';
import {
	ACCURACY_MISS_CAP,
	AUDIT_CAP,
	COMPARE_ROW_CAP,
	GRID_SERIES_CAP,
	METHOD_CAP,
	PLAN_CAP,
	PRICING_CAP,
	SCENARIO_CAP,
} from './schema.js';

type PageOpts = { page?: number; limit?: number };

function resolvePage(opts: PageOpts | undefined, defaultLimit: number) {
	return {
		page: opts?.page ?? 1,
		limit: opts?.limit ?? defaultLimit,
	};
}

function shapeScopes(
	scopes: DemandPlanType['channelScopes'],
	includeDetail: boolean
) {
	return scopes.map((scope) =>
		omitNulls({
			channel: scope.channel,
			skuCount: scope.skuSettingIds.length,
			skuSettingIds: includeDetail ? scope.skuSettingIds : undefined,
		})
	);
}

export function shapePlan(
	plan: DemandPlanType,
	opts: { includeDetail?: boolean } = {}
) {
	return omitNulls({
		id: plan.id,
		name: plan.name,
		kind: plan.kind,
		status: plan.status,
		planMonth: plan.planMonth,
		horizonEnd: plan.horizonEnd,
		basePlanId: plan.basePlanId,
		notes: plan.notes || undefined,
		flagOverrideAbovePct: plan.flagOverrideAbovePct,
		requireReasonAbovePct: plan.requireReasonAbovePct,
		savedAt: plan.savedAt,
		finalizedAt: plan.finalizedAt,
		createdAt: plan.createdAt,
		channelScopes: shapeScopes(plan.channelScopes, Boolean(opts.includeDetail)),
	});
}

export function shapePlanList(
	plans: DemandPlanListItemType[],
	opts: PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, PLAN_CAP);
	const paged = pageWithMeta(plans, page, limit);
	return omitNulls({
		plans: paged.items.map((plan) =>
			omitNulls({
				id: plan.id,
				name: plan.name,
				kind: plan.kind,
				status: plan.status,
				planMonth: plan.planMonth,
				horizonEnd: plan.horizonEnd,
				basePlanId: plan.basePlanId,
				totalCases: round2(plan.totalCases),
				totalRevenue: round2(plan.totalRevenue),
				overrideCount: plan.overrideCount,
				createdBy: plan.createdBy,
				finalizedBy: plan.finalizedBy,
				finalizedAt: plan.finalizedAt,
				createdAt: plan.createdAt,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

export function shapeScenarios(
	scenarios: DemandScenarioListItemType[],
	opts: PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, SCENARIO_CAP);
	const paged = pageWithMeta(scenarios, page, limit);
	return omitNulls({
		scenarios: paged.items.map((plan) =>
			omitNulls({
				id: plan.id,
				name: plan.name,
				status: plan.status,
				planMonth: plan.planMonth,
				horizonEnd: plan.horizonEnd,
				basePlanId: plan.basePlanId,
				basePlanName: plan.basePlanName,
				totalCases: round2(plan.totalCases),
				totalRevenue: round2(plan.totalRevenue),
				overrideCount: plan.overrideCount,
				createdBy: plan.createdBy,
				savedAt: plan.savedAt,
				createdAt: plan.createdAt,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function shapeCell(period: string, cell: DemandGridCellType) {
	return omitNulls({
		period,
		actualUnits: cell.actualUnits,
		planUnits: cell.planUnits,
		statisticalUnits: cell.statisticalUnits,
		isPartialActual: cell.isPartialActual || undefined,
		isOverride: cell.isOverride || undefined,
		isFlagged: cell.isFlagged || undefined,
		overrideReason: cell.overrideReason,
		overrideNote: cell.overrideNote,
		pricePerUnit: round2(cell.pricePerUnit),
		cogsPerUnit: round2(cell.cogsPerUnit),
		fulfillmentCostPerUnit: round2(cell.fulfillmentCostPerUnit),
		projectedRevenue: round2(cell.projectedRevenue),
	});
}

function filterSeries(
	series: DemandGridType['series'],
	opts: { channel?: string; skuSettingId?: string }
) {
	const channel = opts.channel?.toLowerCase();
	return series.filter((row) => {
		if (channel && row.channel.toLowerCase() !== channel) return false;
		if (opts.skuSettingId && row.skuSettingId !== opts.skuSettingId)
			return false;
		return true;
	});
}

/** Forecast months, or one YYYY-MM when `period` is set (including history). */
function visibleCells(
	cells: [string, DemandGridCellType][],
	opts: {
		includeDetail?: boolean;
		period?: string;
		firstForecastPeriod: string;
	}
) {
	if (opts.period) {
		return cells.filter(([period]) => period === opts.period);
	}
	if (!opts.includeDetail) return [];
	return cells.filter(([period]) => period >= opts.firstForecastPeriod);
}

export function shapeGrid(
	grid: DemandGridType,
	opts: {
		includeDetail?: boolean;
		channel?: string;
		skuSettingId?: string;
		period?: string;
	} & PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, GRID_SERIES_CAP);
	const filtered = filterSeries(grid.series, opts);
	const paged = pageWithMeta(filtered, page, limit);
	const showCells = Boolean(opts.includeDetail) || Boolean(opts.period);

	return omitNulls({
		firstForecastPeriod: grid.firstForecastPeriod,
		periodCount: grid.periods.length,
		series: paged.items.map((series) => {
			const cells = Object.entries(series.cells);
			let planUnits = 0;
			let actualUnits = 0;
			let overrideCount = 0;
			for (const [, cell] of cells) {
				planUnits += cell.planUnits ?? 0;
				actualUnits += cell.actualUnits ?? 0;
				if (cell.isOverride) overrideCount += 1;
			}
			const visible = showCells
				? visibleCells(cells, {
						includeDetail: opts.includeDetail,
						period: opts.period,
						firstForecastPeriod: grid.firstForecastPeriod,
					})
				: [];
			return omitNulls({
				channel: series.channel,
				skuSettingId: series.skuSettingId,
				planUnits: round2(planUnits),
				actualUnits: round2(actualUnits),
				overrideCount,
				cells: visible.length
					? visible.map(([period, cell]) => shapeCell(period, cell))
					: undefined,
			});
		}),
		seriesCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
		note: showCells
			? opts.period
				? 'Series totals include every month. Cells are the requested period only.'
				: 'Series totals include history. Cells are forecast months only.'
			: undefined,
	});
}

export function shapeForecastMethods(
	methods: DemandForecastMethodType[],
	opts: PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, METHOD_CAP);
	const paged = pageWithMeta(methods, page, limit);
	return omitNulls({
		methods: paged.items.map((method) =>
			omitNulls({
				channel: method.channel,
				skuSettingId: method.skuSettingId,
				method: method.method,
				growthPct: method.growthPct,
				windowMonths: method.windowMonths,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function effectiveTime(value: Date | string): number {
	const time = new Date(value).getTime();
	return Number.isFinite(time) ? time : 0;
}

function forSku<T extends { skuSettingId: string }>(
	rows: T[],
	skuSettingId?: string
): T[] {
	if (!skuSettingId) return rows;
	return rows.filter((row) => row.skuSettingId === skuSettingId);
}

function utcDateKey(value: Date | string): string {
	return new Date(value).toISOString().slice(0, 10);
}

/** Newest row on or before today. A future effectiveFrom is not yet in force. */
function currentVersions<T extends { effectiveFrom: Date | string }>(
	rows: T[],
	keyFn: (row: T) => string
): T[] {
	const today = new Date().toISOString().slice(0, 10);
	const best = new Map<string, T>();
	for (const row of rows) {
		if (utcDateKey(row.effectiveFrom) > today) continue;
		const key = keyFn(row);
		const existing = best.get(key);
		if (
			!existing ||
			effectiveTime(row.effectiveFrom) > effectiveTime(existing.effectiveFrom)
		) {
			best.set(key, row);
		}
	}
	return [...best.values()];
}

export function shapePricing(
	pricing: DemandPlanPricingType,
	opts: { includeDetail?: boolean; skuSettingId?: string } & PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, PRICING_CAP);
	const includeDetail = Boolean(opts.includeDetail);
	const cogsSource = forSku(pricing.cogs, opts.skuSettingId);
	const fulfillmentSource = forSku(
		pricing.channelFulfillmentCosts,
		opts.skuSettingId
	);
	const priceSource = forSku(pricing.channelPrices, opts.skuSettingId);
	const cogs = pageWithMeta(
		includeDetail
			? cogsSource
			: currentVersions(cogsSource, (row) => row.skuSettingId),
		page,
		limit
	);
	const fulfillment = pageWithMeta(
		includeDetail
			? fulfillmentSource
			: currentVersions(
					fulfillmentSource,
					(row) => `${row.skuSettingId}|${row.channel}`
				),
		page,
		limit
	);
	const prices = pageWithMeta(
		includeDetail
			? priceSource
			: currentVersions(
					priceSource,
					(row) => `${row.skuSettingId}|${row.channel}`
				),
		page,
		limit
	);

	return omitNulls({
		cogs: cogs.items.map((row) =>
			omitNulls({
				skuSettingId: row.skuSettingId,
				amount: round2(row.amount),
				materials: includeDetail ? round2(row.materials) : undefined,
				production: includeDetail ? round2(row.production) : undefined,
				shipping: includeDetail ? round2(row.shipping) : undefined,
				effectiveFrom: row.effectiveFrom,
				note: row.note,
			})
		),
		cogsTotalCount: cogs.totalCount,
		cogsTruncated: cogs.truncated,
		channelFulfillmentCosts: fulfillment.items.map((row) =>
			omitNulls({
				skuSettingId: row.skuSettingId,
				channel: row.channel,
				amount: round2(row.amount),
				storage: includeDetail ? round2(row.storage) : undefined,
				pick: includeDetail ? round2(row.pick) : undefined,
				pack: includeDetail ? round2(row.pack) : undefined,
				shipping: includeDetail ? round2(row.shipping) : undefined,
				effectiveFrom: row.effectiveFrom,
				note: row.note,
			})
		),
		fulfillmentTotalCount: fulfillment.totalCount,
		fulfillmentTruncated: fulfillment.truncated,
		channelPrices: prices.items.map((row) =>
			omitNulls({
				skuSettingId: row.skuSettingId,
				channel: row.channel,
				amount: round2(row.amount),
				effectiveFrom: row.effectiveFrom,
				note: row.note,
			})
		),
		pricesTotalCount: prices.totalCount,
		pricesTruncated: prices.truncated,
		page,
		limit,
	});
}

export function shapeAudits(
	audits: DemandPlanAuditType[],
	opts: PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, AUDIT_CAP);
	const paged = pageWithMeta(audits, page, limit);
	return omitNulls({
		audits: paged.items.map((audit) =>
			omitNulls({
				id: audit.id,
				activity: audit.activity,
				userId: audit.userId,
				createdAt: audit.createdAt,
			})
		),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function shapeCompareRow(row: DemandComparisonRowType) {
	return omitNulls({
		channel: row.channel,
		skuSettingId: row.skuSettingId,
		period: row.period,
		unitsA: round2(row.unitsA),
		unitsB: round2(row.unitsB),
		revenueA: round2(row.revenueA),
		revenueB: round2(row.revenueB),
		volumeEffect: round2(row.volumeEffect),
		priceEffect: round2(row.priceEffect),
		scopeEffect: round2(row.scopeEffect),
	});
}

export function shapeComparison(
	comparison: DemandComparisonType,
	opts: PageOpts = {}
) {
	const { page, limit } = resolvePage(opts, COMPARE_ROW_CAP);
	const paged = pageWithMeta(comparison.rows, page, limit);
	return omitNulls({
		planA: comparison.planA,
		planB: comparison.planB,
		periods: comparison.periods,
		scopeDiff: comparison.scopeDiff,
		rows: paged.items.map(shapeCompareRow),
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

function shapeAccuracyRow(row: DemandAccuracyType & { channel?: string }) {
	return omitNulls({
		channel: row.channel,
		lag: row.lag,
		planId: row.planId,
		planName: row.planName,
		planMonth: row.planMonth,
		forecast: round2(row.forecast),
		actual: round2(row.actual),
		variance: round2(row.variance),
		accuracyPct: round2(row.accuracyPct),
	});
}

export function shapeAccuracy(raw: GetDemandAccuracyResponseType) {
	const misses = capWithMeta(raw.misses, ACCURACY_MISS_CAP);
	return omitNulls({
		demandPeriod: raw.demandPeriod,
		lag: raw.lag,
		expectedPlanMonth: raw.expectedPlanMonth,
		availablePeriods: raw.availablePeriods,
		availableLags: raw.availableLags,
		summary: raw.summary ? shapeAccuracyRow(raw.summary) : undefined,
		bias: raw.bias,
		byChannel: raw.byChannel.map(shapeAccuracyRow),
		byLag: raw.byLag.map(shapeAccuracyRow),
		trend: raw.trend.map((point) =>
			omitNulls({
				period: point.period,
				forecast: round2(point.forecast),
				actual: round2(point.actual),
				variance: round2(point.variance),
				accuracyPct: round2(point.accuracyPct),
			})
		),
		misses: misses.items.map((miss) =>
			omitNulls({
				channel: miss.channel,
				skuSettingId: miss.skuSettingId,
				forecast: round2(miss.forecast),
				actual: round2(miss.actual),
				variance: round2(miss.variance),
				accuracyPct: round2(miss.accuracyPct),
			})
		),
		missesTruncated: misses.truncated,
	});
}
