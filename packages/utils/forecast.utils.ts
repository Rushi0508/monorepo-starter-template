import { ForecastMethodTypeEnum } from '@repo/enums';

/**
 * The statistical baseline: what a series would do if nobody intervened.
 *
 * Shared rather than server-only so a preview in the UI and the number the grid
 * stores come from one implementation. Two copies of this would drift, and the
 * drift would look like a bug in the forecast rather than in the preview.
 *
 * Pure: no database, no clock. Everything that varies — which months are
 * closed, what the method is — arrives as an argument, which is what lets a
 * finalized plan recompute identically from its frozen actuals.
 */

/** One month of history for a single channel x SKU series. */
export type ActualPoint = {
	period: string;
	units: number;
	isPartial: boolean;
};

export type MethodConfig = {
	method: ForecastMethodTypeEnum;
	/** STATIC_GROWTH — month-over-month rate, e.g. 0.09 for 9%. */
	growthPct?: number | null;
	/** HISTORICAL_AVERAGE — trailing window size in months. */
	windowMonths?: number | null;
};

/** "2026-08" shifted by whole months, forwards or backwards. */
const shiftPeriod = (period: string, months: number): string => {
	const [year, month] = period.split('-').map(Number) as [number, number];
	const date = new Date(Date.UTC(year, month - 1 + months, 1));
	return `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, '0')}`;
};

const monthsApart = (from: string, to: string): number => {
	const [fy, fm] = from.split('-').map(Number) as [number, number];
	const [ty, tm] = to.split('-').map(Number) as [number, number];
	return (ty - fy) * 12 + (tm - fm);
};

/** Units are whole cases; a forecast of 412.6 is not a thing you can ship. */
const round = (n: number) => Math.max(0, Math.round(n));

/**
 * The history a baseline may be drawn from: closed months only, oldest first.
 *
 * The month in progress is excluded even though its cell stays editable — a
 * half-finished month averaged in as though it were complete drags every
 * forecast down.
 */
export function closedHistory(actuals: ActualPoint[]): ActualPoint[] {
	return actuals
		.filter((a) => !a.isPartial)
		.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Projects one series across `periods`.
 *
 * Returns zeros rather than throwing when there is no history: a SKU with no
 * sales yet is a normal state, and the planner can still type over the top.
 */
export function projectSeries(
	config: MethodConfig,
	actuals: ActualPoint[],
	periods: string[]
): Map<string, number> {
	const projection = new Map<string, number>();

	// HARD_ENTRY has no statistical baseline by definition — every value comes
	// from what the planner typed, so the baseline an override is measured
	// against is zero.
	if (config.method === ForecastMethodTypeEnum.HARD_ENTRY) {
		for (const period of periods) projection.set(period, 0);
		return projection;
	}

	const history = closedHistory(actuals);
	if (history.length === 0) {
		for (const period of periods) projection.set(period, 0);
		return projection;
	}

	const last = history[history.length - 1] as ActualPoint;

	if (config.method === ForecastMethodTypeEnum.STATIC_GROWTH) {
		const rate = config.growthPct ?? 0;
		for (const period of periods) {
			// Compounds off the last known actual, so the first forecast month is
			// one step of growth away from it — not equal to it.
			const steps = monthsApart(last.period, period);
			projection.set(period, round(last.units * (1 + rate) ** steps));
		}
		return projection;
	}

	// HISTORICAL_AVERAGE — average the trailing window and hold it flat.
	const window = Math.max(1, config.windowMonths ?? 1);
	const from = shiftPeriod(last.period, -(window - 1));
	const inWindow = history.filter((a) => a.period >= from);
	const mean =
		inWindow.reduce((sum, a) => sum + a.units, 0) / (inWindow.length || 1);

	for (const period of periods) projection.set(period, round(mean));
	return projection;
}

/**
 * How far an override sits from the baseline it replaced, as a fraction.
 *
 * A baseline of zero has no meaningful percentage — any override is infinitely
 * far from nothing — so it reports null rather than dividing by zero.
 */
export function overrideDeviation(
	planUnits: number,
	statisticalUnits: number
): number | null {
	if (statisticalUnits === 0) return null;
	return Math.abs(planUnits - statisticalUnits) / statisticalUnits;
}
