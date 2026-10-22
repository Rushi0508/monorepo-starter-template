import type { ChannelEnum } from '@repo/enums';
import type {
	DemandComparisonRowType,
	DemandComparisonType,
} from '@repo/types';

export type ComparisonTotals = {
	unitsA: number;
	unitsB: number;
	revenueA: number;
	revenueB: number;
	volumeEffect: number;
	priceEffect: number;
	scopeEffect: number;
	changePct: number | null;
};

export const emptyTotals = (): ComparisonTotals => ({
	unitsA: 0,
	unitsB: 0,
	revenueA: 0,
	revenueB: 0,
	volumeEffect: 0,
	priceEffect: 0,
	scopeEffect: 0,
	changePct: null,
});

const accumulate = (into: ComparisonTotals, row: DemandComparisonRowType) => {
	into.unitsA += row.unitsA;
	into.unitsB += row.unitsB;
	into.revenueA += row.revenueA;
	into.revenueB += row.revenueB;
	into.volumeEffect += row.volumeEffect;
	into.priceEffect += row.priceEffect;
	into.scopeEffect += row.scopeEffect;
};

const withChangePct = (totals: ComparisonTotals): ComparisonTotals => {
	totals.changePct =
		totals.unitsA === 0
			? null
			: (totals.unitsB - totals.unitsA) / totals.unitsA;
	return totals;
};

export const revenueDelta = (totals: ComparisonTotals): number =>
	totals.revenueB - totals.revenueA;

export const unitsDelta = (totals: ComparisonTotals): number =>
	totals.unitsB - totals.unitsA;

export function totalsOf(rows: DemandComparisonRowType[]): ComparisonTotals {
	const totals = emptyTotals();
	for (const row of rows) accumulate(totals, row);
	return withChangePct(totals);
}

export function byPeriod(
	comparison: DemandComparisonType
): (ComparisonTotals & { period: string })[] {
	const buckets = new Map<string, ComparisonTotals>(
		comparison.periods.map((period) => [period, emptyTotals()])
	);
	for (const row of comparison.rows) {
		const bucket = buckets.get(row.period);
		if (bucket) accumulate(bucket, row);
	}
	return comparison.periods.map((period) => ({
		period,
		...withChangePct(buckets.get(period) ?? emptyTotals()),
	}));
}

export function biggestMoverPeriod(
	comparison: DemandComparisonType
): string | undefined {
	return [...byPeriod(comparison)].sort(
		(a, b) => Math.abs(revenueDelta(b)) - Math.abs(revenueDelta(a))
	)[0]?.period;
}

export type MoversBy = 'sku' | 'channel';

export type MoverRow = ComparisonTotals & {
	channel: ChannelEnum;
	skuSettingId: string;
	groupKey: string;
	children: MoverRow[];
	isScopeChange: boolean;
};

const finalize = (row: MoverRow): MoverRow => {
	withChangePct(row);
	row.isScopeChange =
		row.scopeEffect !== 0 && row.volumeEffect === 0 && row.priceEffect === 0;
	return row;
};

export type PeriodRange = { from: string; to: string };

export function totalsOfMovers(rows: MoverRow[]): ComparisonTotals {
	const totals = emptyTotals();
	for (const row of rows) {
		totals.unitsA += row.unitsA;
		totals.unitsB += row.unitsB;
		totals.revenueA += row.revenueA;
		totals.revenueB += row.revenueB;
		totals.volumeEffect += row.volumeEffect;
		totals.priceEffect += row.priceEffect;
		totals.scopeEffect += row.scopeEffect;
	}
	return withChangePct(totals);
}

export function rollUpMovers(
	rows: DemandComparisonRowType[],
	range: PeriodRange,
	moversBy: MoversBy = 'sku'
): MoverRow[] {
	const groups = new Map<string, MoverRow>();

	for (const row of rows) {
		if (row.period < range.from || row.period > range.to) continue;

		const groupKey = moversBy === 'sku' ? row.skuSettingId : row.channel;
		const group =
			groups.get(groupKey) ??
			({
				...emptyTotals(),
				channel: row.channel,
				skuSettingId: row.skuSettingId,
				groupKey,
				children: [],
				isScopeChange: false,
			} as MoverRow);

		accumulate(group, row);

		const childKey = moversBy === 'sku' ? row.channel : row.skuSettingId;
		const child =
			group.children.find((c) => c.groupKey === childKey) ??
			({
				...emptyTotals(),
				channel: row.channel,
				skuSettingId: row.skuSettingId,
				groupKey: childKey,
				children: [],
				isScopeChange: false,
			} as MoverRow);
		if (!group.children.includes(child)) group.children.push(child);
		accumulate(child, row);

		groups.set(groupKey, group);
	}

	for (const group of groups.values()) {
		finalize(group);
		for (const child of group.children) finalize(child);
		group.children.sort((a, b) =>
			moversBy === 'sku'
				? a.channel.localeCompare(b.channel)
				: a.skuSettingId.localeCompare(b.skuSettingId)
		);
	}

	return [...groups.values()].sort(
		(a, b) => Math.abs(revenueDelta(b)) - Math.abs(revenueDelta(a))
	);
}
