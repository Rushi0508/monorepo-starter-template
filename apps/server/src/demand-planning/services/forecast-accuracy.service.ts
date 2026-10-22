import { Injectable } from '@nestjs/common';
import { DemandPlanKind, DemandPlanStatus } from '@repo/db';
import type {
	DemandAccuracyMissType,
	DemandAccuracyType,
	GetDemandAccuracyResponseType,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { DemandAccuracyQueryDto } from '../dto/demand-accuracy-query.dto';
import { addMonths, currentPeriod } from '../helpers/period';
import { DemandGridService, type GridCell } from './demand-grid.service';

/**
 * Lag N grades a month against the plan cut N months before it, so two scores
 * are only comparable at the same lag.
 */
const MAX_LAG = 6;

/** Far enough ahead to be worth ordering on, which is what the page is for. */
const DEFAULT_LAG = 3;

const scoreAccuracy = (forecast: number, actual: number): number => {
	// Forecasting nothing and selling nothing is a perfect call, not a total miss.
	if (forecast === 0) return actual === 0 ? 1 : 0;
	return Math.max(0, 1 - Math.abs(actual - forecast) / forecast);
};

type Totals = { forecast: number; actual: number };

const empty = (): Totals => ({ forecast: 0, actual: 0 });

@Injectable()
export class ForecastAccuracyService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly grid: DemandGridService
	) {}

	async getAccuracy(
		query: DemandAccuracyQueryDto
	): Promise<GetDemandAccuracyResponseType> {
		const plans = await this.prisma.demandPlan.findMany({
			where: { kind: DemandPlanKind.BASE, status: DemandPlanStatus.FINAL },
			orderBy: [{ planMonth: 'asc' }, { finalizedAt: 'asc' }],
		});

		const closedActuals = await this.prisma.demandActual.findMany({
			where: {
				isPartial: false,
				period: { lt: currentPeriod() },
				...(query.channels?.length ? { channel: { in: query.channels } } : {}),
				...(query.skuSettingIds?.length
					? { skuSettingId: { in: query.skuSettingIds } }
					: {}),
			},
		});

		const planByMonth = new Map<string, (typeof plans)[number]>();
		for (const plan of plans) planByMonth.set(plan.planMonth, plan);

		const actualByPeriod = new Map<string, number>();
		const actualByCell = new Map<string, number>();
		for (const row of closedActuals) {
			actualByPeriod.set(
				row.period,
				(actualByPeriod.get(row.period) ?? 0) + row.units
			);
			const key = `${row.channel}|${row.skuSettingId}|${row.period}`;
			actualByCell.set(key, (actualByCell.get(key) ?? 0) + row.units);
		}

		const availablePeriods = [...actualByPeriod.keys()].sort();
		const availableLags = Array.from({ length: MAX_LAG }, (_, i) => i + 1);

		const demandPeriod =
			query.demandPeriod ?? availablePeriods.at(-1) ?? currentPeriod();

		const grids = await this.grid.getGridsFor(plans.map((plan) => plan.id));
		const gridFor = (planId: string): GridCell[] => grids.get(planId) ?? [];

		const inScope = (cell: Pick<GridCell, 'channel' | 'skuSettingId'>) =>
			(!query.channels?.length || query.channels.includes(cell.channel)) &&
			(!query.skuSettingIds?.length ||
				query.skuSettingIds.includes(cell.skuSettingId));

		const score = (
			period: string,
			atLag: number
		): { summary: DemandAccuracyType; cells: GridCell[] } | null => {
			const plan = this.planFor(planByMonth, period, atLag);
			if (!plan) return null;

			const cells = gridFor(plan.id).filter(
				(cell) => cell.period === period && inScope(cell)
			);
			if (cells.length === 0) return null;

			const forecast = cells.reduce(
				(sum, cell) => sum + (cell.planUnits ?? 0),
				0
			);
			const actual = cells.reduce(
				(sum, cell) =>
					sum +
					(actualByCell.get(`${cell.channel}|${cell.skuSettingId}|${period}`) ??
						0),
				0
			);

			return {
				summary: {
					lag: atLag,
					planId: plan.id,
					planName: plan.name,
					planMonth: plan.planMonth,
					forecast,
					actual,
					variance: actual - forecast,
					accuracyPct: scoreAccuracy(forecast, actual),
				},
				cells,
			};
		};

		let lag = query.lag && query.lag >= 1 ? query.lag : 0;
		if (lag === 0) {
			for (const candidate of [DEFAULT_LAG, ...availableLags]) {
				if (this.planFor(planByMonth, demandPeriod, candidate)) {
					lag = candidate;
					break;
				}
			}
			if (lag === 0) lag = DEFAULT_LAG;
		}

		const selected = score(demandPeriod, lag);

		const byChannelTotals = new Map<string, Totals>();
		const misses: DemandAccuracyMissType[] = [];

		for (const cell of selected?.cells ?? []) {
			const actual =
				actualByCell.get(
					`${cell.channel}|${cell.skuSettingId}|${demandPeriod}`
				) ?? 0;

			const totals = byChannelTotals.get(cell.channel) ?? empty();
			totals.forecast += cell.planUnits ?? 0;
			totals.actual += actual;
			byChannelTotals.set(cell.channel, totals);

			const forecast = cell.planUnits ?? 0;
			misses.push({
				channel: cell.channel,
				skuSettingId: cell.skuSettingId,
				forecast,
				actual,
				variance: actual - forecast,
				accuracyPct: scoreAccuracy(forecast, actual),
			});
		}

		misses.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

		const byChannel = selected
			? [...byChannelTotals.entries()].map(([channel, totals]) => ({
					...selected.summary,
					channel,
					forecast: totals.forecast,
					actual: totals.actual,
					variance: totals.actual - totals.forecast,
					accuracyPct: scoreAccuracy(totals.forecast, totals.actual),
				}))
			: [];

		const byLag = availableLags
			.map((atLag) => score(demandPeriod, atLag))
			.filter((row): row is NonNullable<typeof row> => row !== null)
			.map((row) => row.summary);

		const trendScores = availablePeriods.map((period) => ({
			period,
			scored: score(period, lag),
		}));

		const trend = trendScores.map(({ period, scored }) => ({
			period,
			forecast: scored?.summary.forecast ?? 0,
			actual: scored?.summary.actual ?? actualByPeriod.get(period) ?? 0,
			variance: scored?.summary.variance ?? 0,
			accuracyPct: scored?.summary.accuracyPct ?? 0,
		}));

		const scored = trend.filter((point) => point.forecast > 0);
		const forecastTotal = scored.reduce(
			(sum, point) => sum + point.forecast,
			0
		);

		return {
			demandPeriod,
			lag,
			expectedPlanMonth: addMonths(demandPeriod, -lag),
			availablePeriods,
			availableLags,
			summary: selected?.summary ?? null,
			byChannel,
			misses,
			byLag,
			trend,
			bias:
				forecastTotal === 0
					? null
					: {
							pct:
								scored.reduce((sum, point) => sum + point.variance, 0) /
								forecastTotal,
							months: scored.length,
						},
		};
	}

	private planFor<T>(
		planByMonth: Map<string, T>,
		period: string,
		lag: number
	): T | undefined {
		return planByMonth.get(addMonths(period, -lag));
	}
}
