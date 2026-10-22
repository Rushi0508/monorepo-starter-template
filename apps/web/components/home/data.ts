import type { DashboardDailyPoint } from '@repo/types';
import { type ChartGranularity, groupByGranularity } from '@repo/utils';

const r2 = (n: number) => Math.round(n * 100) / 100;

export type DashboardTrendPoint = {
	/** Compact x-axis label */
	label: string;
	/** Verbose label shown in the tooltip */
	rangeLabel: string;
	grossRevenue: number;
	netRevenue: number;
	orders: number;
	grossAov: number;
	netAov: number;
};

/**
 * Rolls the per-day dashboard trend into day / week / month / quarter buckets.
 * Revenue and order counts are additive; AOV is recomputed from the bucket
 * totals rather than averaged, so it stays order-weighted.
 */
export function toTrendPoints(
	points: DashboardDailyPoint[],
	granularity: ChartGranularity
): DashboardTrendPoint[] {
	return groupByGranularity(points, granularity, (p) => p.date).map(
		({ label, rangeLabel, items }) => {
			const grossRevenue = items.reduce((s, p) => s + p.grossRevenue, 0);
			const netRevenue = items.reduce((s, p) => s + p.netRevenue, 0);
			const orders = items.reduce((s, p) => s + p.orders, 0);

			return {
				label,
				rangeLabel,
				grossRevenue: r2(grossRevenue),
				netRevenue: r2(netRevenue),
				orders,
				grossAov: orders > 0 ? r2(grossRevenue / orders) : 0,
				netAov: orders > 0 ? r2(netRevenue / orders) : 0,
			};
		}
	);
}
