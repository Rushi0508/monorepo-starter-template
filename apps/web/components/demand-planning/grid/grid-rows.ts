import type { DemandGridCellType, DemandGridType } from '@repo/types';

/**
 * Turns the flat cell list into the rows AG Grid renders.
 *
 * The grid is four-dimensional — channel x SKU x month x metric — so months
 * become columns and every other dimension collapses into rows: one row per
 * metric, six per SKU, grouped by channel.
 */

export const METRICS = [
	'actual',
	'statistical',
	'plan',
	'variance',
	'actualRevenue',
	'projectedRevenue',
] as const;

export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
	actual: 'Actual',
	statistical: 'Statistical',
	plan: 'Plan',
	variance: 'Variance',
	actualRevenue: 'Actual Rev',
	projectedRevenue: 'Projected Rev',
};

export type GridRow = {
	id: string;
	channel: string;
	skuSettingId: string;
	metric: Metric;
	/** Only the first metric row of a SKU carries its name, so it reads as a block. */
	isFirstOfSku: boolean;
	/** period -> value. Null renders as an em dash. */
	values: Record<string, number | null>;
	/** period -> the cell behind it, for editing and cell styling. */
	cells: Record<string, DemandGridCellType>;
	total: number | null;
	/** Set on the pinned summary rows, which have no SKU or metric of their own. */
	summaryLabel?: string;
	isEmphasised?: boolean;
};

const valueFor = (cell: DemandGridCellType, metric: Metric): number | null => {
	switch (metric) {
		case 'actual':
			return cell.actualUnits;
		case 'statistical':
			return cell.statisticalUnits;
		case 'plan':
			return cell.planUnits;
		case 'variance':
			// Only meaningful where both exist; an untouched cell reads zero, not
			// a blank, so a row of zeroes says "nothing was overridden here".
			return cell.planUnits === null || cell.statisticalUnits === null
				? null
				: cell.planUnits - cell.statisticalUnits;
		case 'actualRevenue':
			return cell.actualRevenue;
		case 'projectedRevenue':
			return cell.projectedRevenue;
	}
};

/** Metrics measured in money rather than cases. */
export const isMoney = (metric: Metric): boolean =>
	metric === 'actualRevenue' || metric === 'projectedRevenue';

/** Marks a row's unit, so a column of dashes still says what it would hold. */
export const withMoneyUnit = (label: string) => `${label} ($)`;

/** The metric name as the grid shows it, unit included. */
export const metricLabel = (metric: Metric): string =>
	isMoney(metric)
		? withMoneyUnit(METRIC_LABELS[metric])
		: METRIC_LABELS[metric];

export type GroupBy = 'channel' | 'sku';

/**
 * A closed month has shipped, so the group reads its actuals; a forecast month
 * has not, so it reads the plan. Summing every metric row would add actuals to
 * forecasts to variances.
 */
export function groupValueFor(
	leaves: { data?: GridRow }[],
	period: string,
	isForecast: boolean
): number | null {
	const metric: Metric = isForecast ? 'plan' : 'actual';
	let sum: number | null = null;

	for (const leaf of leaves) {
		if (leaf.data?.metric !== metric) continue;
		const value = leaf.data.values[period];
		if (value !== null && value !== undefined) sum = (sum ?? 0) + value;
	}
	return sum;
}

export function groupTotalFor(
	leaves: { data?: GridRow }[],
	periods: string[],
	firstForecastPeriod: string
): number | null {
	let sum: number | null = null;
	for (const period of periods) {
		const value = groupValueFor(leaves, period, period >= firstForecastPeriod);
		if (value !== null) sum = (sum ?? 0) + value;
	}
	return sum;
}

export function buildRows(grid: DemandGridType): GridRow[] {
	const rows: GridRow[] = [];

	for (const series of grid.series) {
		const { channel, skuSettingId } = series;

		METRICS.forEach((metric, index) => {
			const values: Record<string, number | null> = {};
			const cellsByPeriod: Record<string, DemandGridCellType> = {};
			let total: number | null = null;

			for (const period of grid.periods) {
				const cell = series.cells[period];
				if (!cell) {
					values[period] = null;
					continue;
				}
				cellsByPeriod[period] = cell;
				const value = valueFor(cell, metric);
				values[period] = value;
				if (value !== null) total = (total ?? 0) + value;
			}

			rows.push({
				id: `${channel}|${skuSettingId}|${metric}`,
				channel,
				skuSettingId,
				metric,
				isFirstOfSku: index === 0,
				values,
				cells: cellsByPeriod,
				total,
			});
		});
	}

	return rows;
}

/**
 * The block pinned to the bottom: the plan read as a P&L, top line down.
 *
 * Margin and profit cover the forecast horizon only — the months before it
 * have no plan to take a margin on.
 */
export type SummaryRow = {
	key: string;
	label: string;
	values: Record<string, number | null>;
	total: number | null;
	isMoney: boolean;
	/** Set apart from the rows it is derived from. */
	isEmphasised?: boolean;
};

export function buildSummary(grid: DemandGridType): SummaryRow[] {
	const sum = (pick: (cell: DemandGridCellType) => number | null) => {
		const totals: Record<string, number | null> = {};
		for (const series of grid.series) {
			for (const [period, cell] of Object.entries(series.cells)) {
				const value = pick(cell);
				if (value === null) continue;
				totals[period] = (totals[period] ?? 0) + value;
			}
		}
		return totals;
	};

	const perUnit = (
		rate: (cell: DemandGridCellType) => number | null
	): Record<string, number | null> =>
		sum((cell) => {
			const unitRate = rate(cell);
			return unitRate === null || cell.planUnits === null
				? null
				: Math.round(unitRate * cell.planUnits * 100) / 100;
		});

	const totalPlan = sum((c) => c.planUnits);
	const actualRevenue = sum((c) => c.actualRevenue);
	const projectedRevenue = sum((c) => c.projectedRevenue);
	const cogs = perUnit((c) => c.cogsPerUnit);
	const fulfillment = perUnit((c) => c.fulfillmentCostPerUnit);

	/** Revenue less a cost, wherever revenue exists at all. */
	const less = (...costs: Record<string, number | null>[]) => {
		const out: Record<string, number | null> = {};
		for (const period of grid.periods) {
			const revenue = projectedRevenue[period];
			if (revenue === undefined || revenue === null) {
				out[period] = null;
				continue;
			}
			out[period] =
				Math.round(
					(revenue - costs.reduce((n, c) => n + (c[period] ?? 0), 0)) * 100
				) / 100;
		}
		return out;
	};

	const grossMargin = less(cogs);
	const contributionProfit = less(cogs, fulfillment);

	const totalOf = (values: Record<string, number | null>) =>
		grid.periods.reduce((n, period) => n + (values[period] ?? 0), 0);

	const revenueTotal = totalOf(projectedRevenue);
	const marginPct =
		revenueTotal === 0 ? null : totalOf(grossMargin) / revenueTotal;

	const row = (
		key: string,
		label: string,
		values: Record<string, number | null>,
		isMoney: boolean,
		isEmphasised = false
	): SummaryRow => ({
		key,
		label,
		values,
		total: totalOf(values),
		isMoney,
		isEmphasised,
	});

	return [
		row('totalPlan', 'Total plan', totalPlan, false, true),
		row('actualRevenue', withMoneyUnit('Actual revenue'), actualRevenue, true),
		row(
			'projectedRevenue',
			withMoneyUnit('Projected revenue'),
			projectedRevenue,
			true
		),
		row('cogs', withMoneyUnit('COGS'), cogs, true),
		row(
			'grossMargin',
			marginPct === null
				? withMoneyUnit('Gross margin')
				: `${withMoneyUnit('Gross margin')}  ${(marginPct * 100).toFixed(1)}%`,
			grossMargin,
			true
		),
		row('fulfillment', withMoneyUnit('Fulfillment cost'), fulfillment, true),
		row(
			'contribution',
			withMoneyUnit('Contribution profit'),
			contributionProfit,
			true,
			true
		),
	];
}
