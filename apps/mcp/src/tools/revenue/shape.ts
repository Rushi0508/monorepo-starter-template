import type { GetRevenueResponseType, RevenueBreakdownRow } from '@repo/types';
import { capWithMeta, omitNulls, round2, takeLast } from '../../lib/shape.js';
import { TOP_SKU_CAP, TREND_DAYS } from './schema.js';

const shapeRow = (row: RevenueBreakdownRow) => ({
	cases: row.cases,
	grossRevenue: round2(row.grossRevenue),
	netRevenue: round2(row.netRevenue),
	grossMarginPercentage: round2(row.grossMarginPercentage),
	contributionMarginPercentage: round2(row.contributionMarginPercentage),
});

export function shapeRevenue(
	raw: GetRevenueResponseType,
	opts: { skus?: string[]; includeTrend?: boolean } = {}
) {
	const { metrics, breakdown } = raw;
	const byChannel = raw.breakdownBy === 'channel';
	const hasSkuFilter = Boolean(opts.skus && opts.skus.length > 0);

	let skuRows = byChannel ? [] : breakdown;
	let skuBreakdownTruncated: number | undefined;

	if (!byChannel && hasSkuFilter) {
		const filterSkus = opts.skus ?? [];
		skuRows = breakdown.filter((r) =>
			filterSkus.some((s) => s.toLowerCase() === r.key.toLowerCase())
		);
	} else if (!byChannel) {
		const capped = capWithMeta(breakdown, TOP_SKU_CAP);
		skuRows = capped.items;
		skuBreakdownTruncated = capped.truncated;
	}

	return omitNulls({
		metrics: omitNulls({
			grossRevenue: round2(metrics.grossRevenue),
			discounts: round2(metrics.discounts),
			refunds: round2(metrics.refunds),
			netRevenue: round2(metrics.netRevenue),
			totalCasesSold: metrics.totalCasesSold,
			cogs: round2(metrics.cogs),
			grossProfit: round2(metrics.grossProfit),
			grossMarginPercentage: round2(metrics.grossMarginPercentage),
			fulfillmentCost: round2(metrics.fulfillmentCost),
			contributionProfit: round2(metrics.contributionProfit),
			contributionMarginPercentage: round2(
				metrics.contributionMarginPercentage
			),
		}),
		skuBreakdown: byChannel
			? undefined
			: skuRows.map((row) =>
					omitNulls({ sku: row.key, title: row.label, ...shapeRow(row) })
				),
		skuBreakdownTruncated,
		channelBreakdown: byChannel
			? breakdown.map((row) =>
					omitNulls({ channel: row.key, orders: row.orders, ...shapeRow(row) })
				)
			: undefined,
		dailyRevenue: opts.includeTrend
			? takeLast(raw.dailyRevenue, TREND_DAYS).map((d) =>
					omitNulls({
						date: d.date,
						net: round2(d.net),
						gross: round2(d.gross),
						cases: d.cases,
					})
				)
			: undefined,
	});
}
