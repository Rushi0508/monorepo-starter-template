import type { GetDashboardResponseType } from '@repo/types';
import { capWithMeta, omitNulls, round2, takeLast } from '../../lib/shape.js';
import { SESSION_ROW_CAP, TOP_SKU_CAP, TREND_DAYS } from './schema.js';

export type ShapeDashboardOptions = {
	includeTrend?: boolean;
	includeSessions?: boolean;
};

/**
 * Reduce the raw `/api/dashboard` payload to what a model can reason about.
 *
 * Dropped unconditionally:
 *   - `orderStatus[].color`        — UI-only
 *   - `topSkus[].grossRevenue`     — netRevenue is the decision metric
 *   - `dailyTrend[].grossAov/netAov/grossRevenue` — derivable, rarely asked for
 *
 * Opt-in only: `dailyTrend` (last TREND_DAYS points) and `sessionBreakdown`.
 */
export function shapeDashboard(
	raw: GetDashboardResponseType,
	opts: ShapeDashboardOptions = {}
) {
	const { metrics, orderStatus, topSkus, customerSplit } = raw;

	const skus = capWithMeta(topSkus, TOP_SKU_CAP);

	const sessions = opts.includeSessions
		? capWithMeta(
				[...raw.sessionBreakdown].sort((a, b) => b.sessions - a.sessions),
				SESSION_ROW_CAP
			)
		: undefined;

	return omitNulls({
		metrics: omitNulls({
			orders: metrics.orders,
			netRevenue: round2(metrics.netRevenue),
			netRevenueTrendPercentage: round2(metrics.netRevenueTrendPercentage),
			unitsShipped: metrics.unitsShipped,
			openAlerts: metrics.openAlerts,
			alertDetail: metrics.alertDetail || undefined,
			conversionRate: round2(metrics.conversionRate),
			repeatPurchaseRate: round2(metrics.repeatPurchaseRate),
			avgTimeBetweenOrders: round2(metrics.avgTimeBetweenOrders),
			activeSubscriptions: metrics.activeSubscriptions,
		}),

		orderStatus: orderStatus.map((s) => ({
			key: s.key,
			label: s.label,
			count: s.count,
		})),

		topSkus: skus.items.map((s) =>
			omitNulls({
				sku: s.sku,
				title: s.title,
				netRevenue: round2(s.netRevenue),
				units: s.units,
			})
		),
		topSkusTruncated: skus.truncated,

		customerSplit,

		dailyTrend: opts.includeTrend
			? takeLast(raw.dailyTrend, TREND_DAYS).map((d) =>
					omitNulls({
						date: d.date,
						netRevenue: round2(d.netRevenue),
						orders: d.orders,
					})
				)
			: undefined,

		sessionBreakdown: sessions?.items.map((s) => ({
			channel: s.referringChannel,
			device: s.deviceType,
			sessions: s.sessions,
			checkouts: s.completedCheckouts,
		})),
		sessionBreakdownTruncated: sessions?.truncated,
	});
}
