import { ChannelEnum } from '@repo/enums';
import type { RevenueDailyPoint } from '@repo/types';
import { type ChartGranularity, groupByGranularity } from '@repo/utils';

const r2 = (n: number) => Math.round(n * 100) / 100;

type BarLabels = {
	/** Compact x-axis label */
	label: string;
	/** Verbose label shown in the tooltip */
	rangeLabel: string;
};

export type ChannelBar = BarLabels & Record<ChannelEnum, number>;

/** One bucket of the SKU view: a value per series (a SKU code, or "Other"). */
export type SkuBar = BarLabels & { [series: string]: number | string };

/** Which series the daily chart stacks — net revenue or cases sold. */
export type RevenueChartMetric = 'net' | 'cases';

/** How many SKUs get their own stack before the rest fold into "Other". */
export const TOP_SKU_SERIES = 8;
export const OTHER_SERIES = 'Other';

/**
 * Rolls per-day points split by channel into day / week / month / quarter
 * buckets, one stacked value per channel for the selected metric.
 */
export function toChannelBars(
	points: RevenueDailyPoint[],
	granularity: ChartGranularity,
	metric: RevenueChartMetric = 'net'
): ChannelBar[] {
	return groupByGranularity(points, granularity, (p) => p.date).map(
		({ label, rangeLabel, items }) => {
			const byChannel = Object.fromEntries(
				Object.values(ChannelEnum).map((c) => [
					c,
					r2(items.reduce((s, p) => s + (p.groups[c]?.[metric] ?? 0), 0)),
				])
			) as Record<ChannelEnum, number>;

			return { label, rangeLabel, ...byChannel };
		}
	);
}

/**
 * The same buckets for points split by SKU. The SKUs with the largest total for
 * the metric across the whole range each get a series; the rest are summed into
 * "Other" so the chart stays readable.
 */
export function toSkuBars(
	points: RevenueDailyPoint[],
	granularity: ChartGranularity,
	metric: RevenueChartMetric = 'net'
): { series: string[]; bars: SkuBar[] } {
	const totals = new Map<string, number>();
	for (const point of points) {
		for (const [sku, day] of Object.entries(point.groups)) {
			totals.set(sku, (totals.get(sku) ?? 0) + day[metric]);
		}
	}

	const ranked = [...totals.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([sku]) => sku);
	const top = ranked.slice(0, TOP_SKU_SERIES);
	const topSet = new Set(top);
	const series = ranked.length > TOP_SKU_SERIES ? [...top, OTHER_SERIES] : top;

	const bars = groupByGranularity(points, granularity, (p) => p.date).map(
		({ label, rangeLabel, items }) => {
			const values: Record<string, number> = Object.fromEntries(
				series.map((key) => [key, 0])
			);
			for (const point of items) {
				for (const [sku, day] of Object.entries(point.groups)) {
					const key = topSet.has(sku) ? sku : OTHER_SERIES;
					values[key] = (values[key] ?? 0) + day[metric];
				}
			}
			for (const key of series) {
				values[key] = r2(values[key] ?? 0);
			}
			return { label, rangeLabel, ...values };
		}
	);

	return { series, bars };
}
