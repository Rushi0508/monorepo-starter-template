/**
 * Resolves the price or cost in force for each month of a plan's horizon.
 *
 * A plan owns its pricing outright. The live SKU settings ladder is copied into
 * the plan when the plan is created, and from then on the plan reads only its
 * own rows — so a later edit in SKU settings cannot move a plan's revenue
 * underneath whoever is working on it.
 *
 * That is also why there is no merge here: one ladder, one answer.
 */

/** An effective-dated amount from a plan's ladder. */
export type LadderRow = {
	/** Stored as a timestamp; only the month it falls in matters here. */
	effectiveFrom: Date;
	amount: number;
};

const toPeriod = (date: Date): string =>
	`${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, '0')}`;

/**
 * The amount in force for each period: the newest ladder row dated on or before
 * it. Periods before the first row have no price and report null, which the
 * caller shows as a gap rather than as zero revenue.
 */
export function resolveByPeriod(
	ladder: LadderRow[],
	periods: string[]
): Map<string, number | null> {
	const sorted = ladder
		.map((row) => ({ period: toPeriod(row.effectiveFrom), amount: row.amount }))
		.sort((a, b) => a.period.localeCompare(b.period));

	const resolved = new Map<string, number | null>();

	for (const period of periods) {
		// Ascending, so the last row not after `period` is the one in force.
		let amount: number | null = null;
		for (const row of sorted) {
			if (row.period > period) break;
			amount = row.amount;
		}
		resolved.set(period, amount);
	}

	return resolved;
}
