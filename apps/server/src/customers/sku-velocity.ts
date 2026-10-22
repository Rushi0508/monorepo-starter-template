const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weeks to spread a customer's units over when measuring velocity: first order
 * to today, so a customer who has gone quiet sees their rate fall. Null with
 * fewer than two orders — a single order has no cadence to measure. Floored at
 * one week so brand-new customers don't show wildly inflated rates.
 */
export const velocityWeeks = (
	orders: { shopifyCreatedAt: Date | null }[],
	now = new Date()
): number | null => {
	if (orders.length < 2) return null;
	const times = orders
		.map((o) => o.shopifyCreatedAt?.getTime())
		.filter((t): t is number => t !== undefined);
	if (times.length === 0) return null;
	return Math.max(1, (now.getTime() - Math.min(...times)) / WEEK_MS);
};
