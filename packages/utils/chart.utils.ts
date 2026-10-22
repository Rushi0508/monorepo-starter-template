import {
	addDays,
	addMonths,
	addQuarters,
	addWeeks,
	differenceInCalendarDays,
	endOfDay,
	endOfMonth,
	endOfQuarter,
	endOfWeek,
	format,
	getQuarter,
	startOfDay,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
} from 'date-fns';
import { parseDateLocal, toYYYYMMDD } from './date.utils';

// ─── Granularity ──────────────────────────────────────────────────────────────
// Trend charts always receive per-day points from the API. Rendering one point
// per day is unreadable past a few weeks, so points are bucketed by day / week /
// month / quarter depending on how wide the selected date range is.

export const CHART_GRANULARITIES = ['day', 'week', 'month', 'quarter'] as const;

export type ChartGranularity = (typeof CHART_GRANULARITIES)[number];

export const CHART_GRANULARITY_LABELS: Record<ChartGranularity, string> = {
	day: 'Daily',
	week: 'Weekly',
	month: 'Monthly',
	quarter: 'Quarterly',
};

export const CHART_GRANULARITY_SHORT_LABELS: Record<ChartGranularity, string> =
	{
		day: 'D',
		week: 'W',
		month: 'M',
		quarter: 'Q',
	};

// Weeks run Monday → Sunday (matches isLastWeek in date.utils)
const WEEK_STARTS_ON = 1;

// Upper bound (inclusive, in days) of the range each granularity covers.
// Chosen so a chart lands roughly in the 6–45 point range:
//   ≤ 45d  → up to 45 daily points   (a month range stays daily)
//   ≤ 210d → up to 30 weekly points  (up to ~7 months)
//   ≤ 730d → up to 24 monthly points (2 years)
//   beyond → quarterly
const GRANULARITY_THRESHOLDS: {
	maxDays: number;
	granularity: ChartGranularity;
}[] = [
	{ maxDays: 45, granularity: 'day' },
	{ maxDays: 210, granularity: 'week' },
	{ maxDays: 730, granularity: 'month' },
];

// Safety valve for the gap-filling loop below
const MAX_BUCKETS = 1000;

/** Inclusive number of calendar days between two dates, or null if unbounded. */
export const getDateSpanInDays = (
	start?: Date | string | null,
	end?: Date | string | null
): number | null => {
	if (!start || !end) return null;

	const from = parseDateLocal(start);
	const to = parseDateLocal(end);
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

	return Math.abs(differenceInCalendarDays(to, from)) + 1;
};

/** Granularity that keeps a chart readable for a range of `spanInDays`. */
export const resolveGranularity = (
	spanInDays?: number | null
): ChartGranularity => {
	if (spanInDays == null || Number.isNaN(spanInDays)) return 'day';

	return (
		GRANULARITY_THRESHOLDS.find((t) => spanInDays <= t.maxDays)?.granularity ??
		'quarter'
	);
};

/** Granularity for a date range, e.g. the dashboard/revenue date filter. */
export const getDefaultGranularity = (
	start?: Date | string | null,
	end?: Date | string | null
): ChartGranularity => resolveGranularity(getDateSpanInDays(start, end));

// ─── Bucket boundaries ────────────────────────────────────────────────────────

export const getBucketStart = (
	date: Date | string,
	granularity: ChartGranularity
): Date => {
	const d = parseDateLocal(date);
	switch (granularity) {
		case 'week':
			return startOfWeek(d, { weekStartsOn: WEEK_STARTS_ON });
		case 'month':
			return startOfMonth(d);
		case 'quarter':
			return startOfQuarter(d);
		default:
			return startOfDay(d);
	}
};

export const getBucketEnd = (
	date: Date | string,
	granularity: ChartGranularity
): Date => {
	const d = parseDateLocal(date);
	switch (granularity) {
		case 'week':
			return endOfWeek(d, { weekStartsOn: WEEK_STARTS_ON });
		case 'month':
			return endOfMonth(d);
		case 'quarter':
			return endOfQuarter(d);
		default:
			return endOfDay(d);
	}
};

const addBuckets = (
	date: Date,
	granularity: ChartGranularity,
	amount: number
): Date => {
	switch (granularity) {
		case 'week':
			return addWeeks(date, amount);
		case 'month':
			return addMonths(date, amount);
		case 'quarter':
			return addQuarters(date, amount);
		default:
			return addDays(date, amount);
	}
};

// ─── Bucket labels ────────────────────────────────────────────────────────────

/** Compact axis label, e.g. "Mar 5", "Mar", "Q1 2026". */
export const formatBucketLabel = (
	start: Date,
	granularity: ChartGranularity,
	options?: { includeYear?: boolean }
): string => {
	const includeYear = options?.includeYear ?? false;
	switch (granularity) {
		case 'month':
			return format(start, includeYear ? "MMM ''yy" : 'MMM');
		case 'quarter':
			return `Q${getQuarter(start)} ${format(start, 'yyyy')}`;
		default:
			// day + week share the "start of period" label
			return format(start, includeYear ? "MMM d ''yy" : 'MMM d');
	}
};

/** Verbose label used in tooltips, e.g. "Mar 2 – Mar 8, 2026". */
export const formatBucketRangeLabel = (
	start: Date,
	end: Date,
	granularity: ChartGranularity
): string => {
	switch (granularity) {
		case 'week':
			return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
		case 'month':
			return format(start, 'MMMM yyyy');
		case 'quarter':
			return `Q${getQuarter(start)} ${format(start, 'yyyy')} · ${format(start, 'MMM')} – ${format(end, 'MMM')}`;
		default:
			return format(start, 'MMM d, yyyy');
	}
};

// ─── Grouping ─────────────────────────────────────────────────────────────────

export type ChartBucket<T> = {
	/** Bucket start as YYYY-MM-DD — stable key for sorting/react keys */
	key: string;
	/** Compact axis label */
	label: string;
	/** Verbose tooltip label */
	rangeLabel: string;
	start: Date;
	end: Date;
	items: T[];
};

/**
 * Groups a time series into day / week / month / quarter buckets, keeping the
 * x-axis continuous: buckets with no data between the first and last bucket are
 * emitted with an empty `items` array so gaps read as zero instead of vanishing.
 */
export const groupByGranularity = <T>(
	items: T[],
	granularity: ChartGranularity,
	getDate: (item: T) => Date | string
): ChartBucket<T>[] => {
	if (!items.length) return [];

	const byKey = new Map<string, { start: Date; items: T[] }>();

	for (const item of items) {
		const date = parseDateLocal(getDate(item));
		if (Number.isNaN(date.getTime())) continue;

		const start = getBucketStart(date, granularity);
		const key = toYYYYMMDD(start);

		const existing = byKey.get(key);
		if (existing) existing.items.push(item);
		else byKey.set(key, { start, items: [item] });
	}

	const sorted = Array.from(byKey.values()).sort(
		(a, b) => a.start.getTime() - b.start.getTime()
	);

	const first = sorted[0];
	const lastBucket = sorted[sorted.length - 1];
	if (!first || !lastBucket) return [];

	// Fill empty buckets between the first and last bucket that has data
	const filled: { start: Date; items: T[] }[] = [];
	const lastTime = lastBucket.start.getTime();
	let cursor = first.start;
	let index = 0;

	while (cursor.getTime() <= lastTime && filled.length < MAX_BUCKETS) {
		const current = sorted[index];
		if (current && current.start.getTime() === cursor.getTime()) {
			filled.push(current);
			index++;
		} else {
			filled.push({ start: cursor, items: [] });
		}
		cursor = addBuckets(cursor, granularity, 1);
	}

	const includeYear =
		first.start.getFullYear() !== lastBucket.start.getFullYear();

	return filled.map(({ start, items: bucketItems }) => {
		const end = getBucketEnd(start, granularity);
		return {
			key: toYYYYMMDD(start),
			label: formatBucketLabel(start, granularity, { includeYear }),
			rangeLabel: formatBucketRangeLabel(start, end, granularity),
			start,
			end,
			items: bucketItems,
		};
	});
};
