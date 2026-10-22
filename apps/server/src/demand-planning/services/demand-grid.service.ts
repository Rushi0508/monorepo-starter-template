import { Injectable, NotFoundException } from '@nestjs/common';
import {
	DEFAULT_FORECAST_METHOD,
	DEFAULT_FORECAST_WINDOW_MONTHS,
} from '@repo/constants';
import {
	type DemandActual,
	type DemandForecastMethod,
	type DemandPlanBaselineActual,
	type DemandPlanChannelFulfillmentCost,
	type DemandPlanChannelPrice,
	type DemandPlanCogs,
	type DemandPlanEntry,
	type Prisma,
} from '@repo/db';
import type {
	ChannelEnum,
	DemandOverrideReasonEnum,
	ForecastMethodTypeEnum,
} from '@repo/enums';
import type {
	DemandGridCellType,
	DemandGridSeriesType,
	DemandGridType,
} from '@repo/types';
import {
	type ActualPoint,
	type MethodConfig,
	overrideDeviation,
	projectSeries,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { currentPeriod, periodRange } from '../helpers/period';
import { isPlanLocked } from '../helpers/plan-lock';
import { type LadderRow, resolveByPeriod } from '../helpers/pricing';

/**
 * Builds a plan's grid.
 *
 * Nothing per-cell is stored: the grid is the statistical baseline with typed
 * entries laid over it, so changing the horizon costs nothing and a finalized
 * plan reproduces from its frozen inputs.
 *
 * A finalized plan reads DemandPlanBaselineActual — the actuals as they stood
 * when it was signed off. A draft reads live actuals, so it tracks reality.
 *
 * Pricing is never read live: a plan owns the ladder copied into it at
 * creation, so a later SKU settings edit cannot move a plan's revenue.
 */

export type GridCell = {
	channel: ChannelEnum;
	skuSettingId: string;
	period: string;

	/**
	 * What shipped. Present for any closed month the pipeline has rolled up,
	 * including months before the plan starts — those are the year to date the
	 * plan is being judged against. Null where nothing shipped yet.
	 */
	actualUnits: number | null;
	/** Gross, to match projectedRevenue: a forecast cannot predict discounts. */
	actualRevenue: number | null;
	/** The month is still running, so its actuals are incomplete. */
	isPartialActual: boolean;

	/** What the method produced. Null before the plan's first forecast month. */
	statisticalUnits: number | null;
	/** What the plan commits to — the entry if one exists, else the baseline. */
	planUnits: number | null;
	isOverride: boolean;
	/** Beyond the plan's flagOverrideAbovePct. Flagged in the grid, not blocked. */
	isFlagged: boolean;
	/** Why the cell departs from the forecast. */
	overrideReason: DemandOverrideReasonEnum | null;
	overrideNote: string | null;
	/** Null where no price is effective yet, which is a gap rather than zero. */
	pricePerUnit: number | null;
	/** COGS for one unit — the same in every channel. */
	cogsPerUnit: number | null;
	/** Fulfillment cost for one unit through this cell's channel. */
	fulfillmentCostPerUnit: number | null;
	/** planUnits priced at the plan's own ladder. Null outside the horizon. */
	projectedRevenue: number | null;
	/** Editable cells are the current month onwards; earlier months have closed. */
	isEditable: boolean;
};

const seriesKey = (channel: string, skuSettingId: string) =>
	`${channel}|${skuSettingId}`;

/** Everything one plan's projection reads, already fetched. */
type PlanData = {
	plan: Prisma.DemandPlanGetPayload<{ include: { channelScopes: true } }>;
	methods: DemandForecastMethod[];
	entries: DemandPlanEntry[];
	baselineActuals: DemandPlanBaselineActual[];
	/** Shared across plans — actuals are not plan-scoped. */
	liveActuals: DemandActual[];
	cogs: DemandPlanCogs[];
	fulfillment: DemandPlanChannelFulfillmentCost[];
	prices: DemandPlanChannelPrice[];
};

@Injectable()
export class DemandGridService {
	constructor(private readonly prisma: PrismaService) {}

	/** The grid as the workspace renders it: columns, and every cell. */
	async getPlanGrid(planId: string): Promise<DemandGridType> {
		// getGrid already loads the plan, so the columns are read off the cells it
		// returns rather than looking the same row up a second time.
		const cells = await this.getGrid(planId);
		const periods = [...new Set(cells.map((cell) => cell.period))].sort();

		// Grouped by series so the channel and SKU travel once rather than once
		// per month, and so a cell lookup is a key rather than a scan.
		const series = new Map<string, DemandGridSeriesType>();
		for (const source of cells) {
			const { channel, skuSettingId, period } = source;
			const cell: DemandGridCellType = {
				actualUnits: source.actualUnits,
				actualRevenue: source.actualRevenue,
				isPartialActual: source.isPartialActual,
				statisticalUnits: source.statisticalUnits,
				planUnits: source.planUnits,
				isOverride: source.isOverride,
				isFlagged: source.isFlagged,
				overrideReason: source.overrideReason,
				overrideNote: source.overrideNote,
				pricePerUnit: source.pricePerUnit,
				cogsPerUnit: source.cogsPerUnit,
				fulfillmentCostPerUnit: source.fulfillmentCostPerUnit,
				projectedRevenue: source.projectedRevenue,
				isEditable: source.isEditable,
			};

			const existing = series.get(seriesKey(channel, skuSettingId));
			if (existing) {
				existing.cells[period] = cell;
				continue;
			}
			series.set(seriesKey(channel, skuSettingId), {
				channel,
				skuSettingId,
				cells: { [period]: cell },
			});
		}

		return {
			periods,
			firstForecastPeriod:
				cells.find((cell) => cell.statisticalUnits !== null)?.period ??
				periods[0] ??
				'',
			series: [...series.values()],
		};
	}

	async getGrid(planId: string): Promise<GridCell[]> {
		const loaded = await this.load([planId]);
		const data = loaded.get(planId);
		if (!data) throw new NotFoundException('Demand plan not found');
		return this.project(data);
	}

	/**
	 * Every plan's grid, from one batch of queries rather than one batch each.
	 *
	 * Plan History needs a total per plan, and computing them one at a time made
	 * the list slower with every plan ever created — seven queries per row, all
	 * of them filtered by a single planId that could just as easily be a set.
	 */
	async getGridsFor(planIds: string[]): Promise<Map<string, GridCell[]>> {
		const loaded = await this.load(planIds);
		return new Map(
			[...loaded].map(([planId, data]) => [planId, this.project(data)])
		);
	}

	/** Everything the projection needs, for as many plans as asked for. */
	private async load(planIds: string[]): Promise<Map<string, PlanData>> {
		if (planIds.length === 0) return new Map();

		const plans = await this.prisma.demandPlan.findMany({
			where: { id: { in: planIds } },
			include: { channelScopes: true },
		});
		if (plans.length === 0) return new Map();

		const lockedPlanIds = plans
			.filter((plan) => isPlanLocked(plan))
			.map((plan) => plan.id);

		// Actuals are not plan-scoped, so one query covers every SKU any of the
		// plans has in scope.
		const allSkuIds = [
			...new Set(
				plans.flatMap((plan) =>
					plan.channelScopes.flatMap((scope) => scope.skuSettingIds)
				)
			),
		];

		const ids = plans.map((plan) => plan.id);

		const [
			methods,
			entries,
			baselineActuals,
			liveActuals,
			cogs,
			fulfillment,
			prices,
		] = await Promise.all([
			this.prisma.demandForecastMethod.findMany({
				where: { planId: { in: ids } },
			}),
			this.prisma.demandPlanEntry.findMany({ where: { planId: { in: ids } } }),
			// Projection input for a finalized plan: the actuals as they stood
			// when it was signed off, which is what makes it reproduce.
			lockedPlanIds.length > 0
				? this.prisma.demandPlanBaselineActual.findMany({
						where: { planId: { in: lockedPlanIds } },
					})
				: Promise.resolve([]),
			// Display. Always live, even for a finalized plan: the forecast is
			// frozen, but what actually shipped keeps accruing.
			this.prisma.demandActual.findMany({
				where: { skuSettingId: { in: allSkuIds } },
			}),
			// Pricing is never read live — a plan owns the ladder copied into it.
			this.prisma.demandPlanCogs.findMany({ where: { planId: { in: ids } } }),
			this.prisma.demandPlanChannelFulfillmentCost.findMany({
				where: { planId: { in: ids } },
			}),
			this.prisma.demandPlanChannelPrice.findMany({
				where: { planId: { in: ids } },
			}),
		]);

		const byPlan = <T extends { planId: string }>(rows: T[]) => {
			const map = new Map<string, T[]>();
			for (const row of rows) {
				map.set(row.planId, [...(map.get(row.planId) ?? []), row]);
			}
			return map;
		};

		const methodsByPlan = byPlan(methods);
		const entriesByPlan = byPlan(entries);
		const baselineByPlan = byPlan(baselineActuals);
		const cogsByPlan = byPlan(cogs);
		const fulfillmentByPlan = byPlan(fulfillment);
		const pricesByPlan = byPlan(prices);

		return new Map(
			plans.map((plan) => [
				plan.id,
				{
					plan,
					methods: methodsByPlan.get(plan.id) ?? [],
					entries: entriesByPlan.get(plan.id) ?? [],
					baselineActuals: baselineByPlan.get(plan.id) ?? [],
					liveActuals,
					cogs: cogsByPlan.get(plan.id) ?? [],
					fulfillment: fulfillmentByPlan.get(plan.id) ?? [],
					prices: pricesByPlan.get(plan.id) ?? [],
				},
			])
		);
	}

	/** Pure: loaded rows in, cells out. No database, no clock but today's month. */
	private project(data: PlanData): GridCell[] {
		const {
			plan,
			methods,
			entries,
			baselineActuals,
			liveActuals,
			cogs: planCogs,
			fulfillment: planFulfillment,
			prices: planPrices,
		} = data;

		const isLocked = isPlanLocked(plan);

		// The grid opens in January of the plan's year so the months already
		// banked sit beside the ones still being planned. Only the horizon is
		// forecast; everything before it is history.
		const displayStart = `${plan.planMonth.slice(0, 4)}-01`;
		const periods = periodRange(displayStart, plan.horizonEnd);
		const forecastPeriods = periodRange(plan.planMonth, plan.horizonEnd);

		// Scope is per channel — a channel sells its own set of SKUs, so the grid
		// walks the pairs it was given rather than crossing two flat lists.
		const scopes = plan.channelScopes.filter(
			(scope) => scope.skuSettingIds.length > 0
		);

		if (periods.length === 0 || scopes.length === 0) {
			return [];
		}

		// ── Index everything by series so the cell loop stays flat ───────────────

		// Prisma types this column as a string union while the shared projection
		// takes the enum, so the value is named as it crosses.
		const methodBySeries = new Map<string, MethodConfig>();
		for (const m of methods) {
			methodBySeries.set(seriesKey(m.channel, m.skuSettingId), {
				method: m.method as ForecastMethodTypeEnum,
				growthPct: m.growthPct,
				windowMonths: m.windowMonths,
			});
		}

		const entryByCell = new Map<string, (typeof entries)[number]>();
		for (const e of entries) {
			entryByCell.set(`${seriesKey(e.channel, e.skuSettingId)}|${e.period}`, e);
		}

		// Baseline rows carry no isPartial — they are closed by construction,
		// having been frozen at finalize.
		const projectionSource = isLocked ? baselineActuals : liveActuals;
		const actualsBySeries = new Map<string, ActualPoint[]>();
		for (const a of projectionSource) {
			const key = seriesKey(a.channel, a.skuSettingId);
			const point: ActualPoint = {
				period: a.period,
				units: a.units,
				isPartial: 'isPartial' in a ? a.isPartial : false,
			};
			actualsBySeries.set(key, [...(actualsBySeries.get(key) ?? []), point]);
		}

		const actualByCell = new Map<string, (typeof liveActuals)[number]>();
		for (const a of liveActuals) {
			actualByCell.set(
				`${seriesKey(a.channel, a.skuSettingId)}|${a.period}`,
				a
			);
		}

		const byId = <T extends { skuSettingId: string }>(rows: T[]) => {
			const map = new Map<string, T[]>();
			for (const row of rows) {
				map.set(row.skuSettingId, [...(map.get(row.skuSettingId) ?? []), row]);
			}
			return map;
		};
		const planCogsBySku = byId(planCogs);

		const priceKey = (skuSettingId: string, channel: string) =>
			`${skuSettingId}|${channel}`;
		const byIdChannel = <T extends { skuSettingId: string; channel: string }>(
			rows: T[]
		) => {
			const map = new Map<string, T[]>();
			for (const row of rows) {
				const k = priceKey(row.skuSettingId, row.channel);
				map.set(k, [...(map.get(k) ?? []), row]);
			}
			return map;
		};
		const planPriceBySeries = byIdChannel(planPrices);
		const planFulfillmentBySeries = byIdChannel(planFulfillment);

		// ── Build ────────────────────────────────────────────────────────────────

		// The current month stays editable and shows actuals-to-date; months that
		// have closed are history and cannot be re-forecast.
		const firstEditable =
			plan.planMonth > currentPeriod() ? plan.planMonth : currentPeriod();

		const toLadder = (rows: { effectiveFrom: Date; amount: number }[]) =>
			rows as LadderRow[];

		const cells: GridCell[] = [];

		for (const scope of scopes) {
			const channel = scope.channel as ChannelEnum;

			for (const skuSettingId of scope.skuSettingIds) {
				const key = seriesKey(channel, skuSettingId);

				const config: MethodConfig = methodBySeries.get(key) ?? {
					method: DEFAULT_FORECAST_METHOD,
					windowMonths: DEFAULT_FORECAST_WINDOW_MONTHS,
				};

				const statistical = projectSeries(
					config,
					actualsBySeries.get(key) ?? [],
					forecastPeriods
				);

				const cogs = resolveByPeriod(
					toLadder(planCogsBySku.get(skuSettingId) ?? []),
					periods
				);
				const fulfillment = resolveByPeriod(
					toLadder(
						planFulfillmentBySeries.get(priceKey(skuSettingId, channel)) ?? []
					),
					periods
				);
				const prices = resolveByPeriod(
					toLadder(
						planPriceBySeries.get(priceKey(skuSettingId, channel)) ?? []
					),
					periods
				);

				for (const period of periods) {
					// Months before the plan starts are history: they carry actuals
					// and nothing else.
					const isForecast = period >= plan.planMonth;
					const statisticalUnits = isForecast
						? (statistical.get(period) ?? 0)
						: null;
					const entry = isForecast
						? entryByCell.get(`${key}|${period}`)
						: undefined;
					const planUnits = entry ? entry.units : statisticalUnits;

					const deviation =
						entry && statisticalUnits !== null
							? overrideDeviation(entry.units, statisticalUnits)
							: null;

					const actual = actualByCell.get(`${key}|${period}`);

					const pricePerUnit = prices.get(period) ?? null;
					const cogsPerUnit = cogs.get(period) ?? null;
					const fulfillmentCostPerUnit = fulfillment.get(period) ?? null;

					cells.push({
						channel,
						skuSettingId,
						period,
						actualUnits: actual?.units ?? null,
						actualRevenue: actual?.grossRevenue ?? null,
						isPartialActual: actual?.isPartial ?? false,
						statisticalUnits,
						planUnits,
						isOverride: Boolean(entry),
						overrideReason:
							(entry?.reason as DemandOverrideReasonEnum | undefined) ?? null,
						overrideNote: entry?.note ?? null,
						isFlagged:
							deviation !== null && deviation > plan.flagOverrideAbovePct,
						pricePerUnit,
						cogsPerUnit,
						fulfillmentCostPerUnit,
						projectedRevenue:
							pricePerUnit === null || planUnits === null
								? null
								: Math.round(planUnits * pricePerUnit * 100) / 100,
						isEditable: isForecast && !isLocked && period >= firstEditable,
					});
				}
			}
		}

		return cells;
	}
}
