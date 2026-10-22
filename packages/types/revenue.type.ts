import type { RevenueGroupBy } from './filters.type';

export type RevenueMetrics = {
	grossRevenue: number;
	discounts: number;
	refunds: number;
	netRevenue: number;
	totalCasesSold: number;
	cogs: number;
	grossProfit: number;
	grossMarginPercentage: number;
	fulfillmentCost: number;
	contributionProfit: number;
	contributionMarginPercentage: number;
};

/** Revenue and cases for one slice of a day. */
export type RevenueTotals = {
	gross: number;
	net: number;
	cases: number;
};

export type RevenueDailyPoint = {
	date: string; // "YYYY-MM-DD"
	gross: number;
	net: number;
	cases: number;
	/**
	 * The day split by channel or by SKU code — whichever `chartBy` asked for.
	 * By channel it comes from whole orders; by SKU, from line items.
	 */
	groups: Record<string, RevenueTotals>;
};

/**
 * One row of the revenue breakdown — a SKU or a channel — with the other
 * dimension as its children. Rows are built from line items, so children add
 * up to their parent.
 */
export type RevenueBreakdownRow = {
	/** SKU code or channel */
	key: string;
	/** Product title or channel name */
	label: string;
	/** Distinct orders — channel rows only */
	orders?: number;
	cases: number;
	grossRevenue: number;
	netRevenue: number;
	grossMarginPercentage: number;
	contributionMarginPercentage: number;
	children?: RevenueBreakdownRow[];
};

export type GetRevenueResponseType = {
	metrics: RevenueMetrics;
	/** How `dailyRevenue` groups are split */
	chartBy: RevenueGroupBy;
	/** How `breakdown` rows are grouped */
	breakdownBy: RevenueGroupBy;
	dailyRevenue: RevenueDailyPoint[];
	breakdown: RevenueBreakdownRow[];
};
