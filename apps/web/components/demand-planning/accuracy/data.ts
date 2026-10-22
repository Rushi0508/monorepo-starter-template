import type { DemandAccuracyMissType } from '@repo/types';

export type MissesBy = 'channel' | 'sku';

export type MissRow = DemandAccuracyMissType & {
	groupKey: string;
	children: MissRow[];
};

const scoreAccuracy = (forecast: number, actual: number): number => {
	if (forecast === 0) return actual === 0 ? 1 : 0;
	return Math.max(0, 1 - Math.abs(actual - forecast) / forecast);
};

export type MissTotals = {
	forecast: number;
	actual: number;
	variance: number;
	accuracyPct: number;
};

export function totalsOfMisses(rows: MissRow[]): MissTotals {
	const forecast = rows.reduce((n, r) => n + r.forecast, 0);
	const actual = rows.reduce((n, r) => n + r.actual, 0);
	return {
		forecast,
		actual,
		variance: actual - forecast,
		accuracyPct: scoreAccuracy(forecast, actual),
	};
}

export function rollUpMisses(
	misses: DemandAccuracyMissType[],
	by: MissesBy
): MissRow[] {
	const groups = new Map<string, MissRow>();

	for (const miss of misses) {
		const groupKey = by === 'channel' ? miss.channel : miss.skuSettingId;
		const group =
			groups.get(groupKey) ??
			({
				channel: miss.channel,
				skuSettingId: miss.skuSettingId,
				forecast: 0,
				actual: 0,
				variance: 0,
				accuracyPct: 0,
				groupKey,
				children: [],
			} as MissRow);

		group.forecast += miss.forecast;
		group.actual += miss.actual;
		group.children.push({ ...miss, groupKey, children: [] });
		groups.set(groupKey, group);
	}

	for (const group of groups.values()) {
		group.variance = group.actual - group.forecast;
		group.accuracyPct = scoreAccuracy(group.forecast, group.actual);
		group.children.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
	}

	return [...groups.values()].sort(
		(a, b) => Math.abs(b.variance) - Math.abs(a.variance)
	);
}
