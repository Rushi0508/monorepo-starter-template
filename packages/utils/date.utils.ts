import { DEFAULT_TIME_ZONE } from '@repo/constants';
import {
	endOfMonth,
	endOfWeek,
	endOfYear,
	format,
	isWithinInterval,
	startOfMonth,
	startOfWeek,
	startOfYear,
	subMonths,
	subWeeks,
	subYears,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { DateRange } from 'react-day-picker';

export const isLastWeek = (date: Date | string): boolean => {
	const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), {
		weekStartsOn: 1,
	});
	const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

	return isWithinInterval(new Date(date), {
		start: lastWeekStart,
		end: lastWeekEnd,
	});
};

export const isLastMonth = (date: Date | string): boolean => {
	const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
	const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

	return isWithinInterval(new Date(date), {
		start: lastMonthStart,
		end: lastMonthEnd,
	});
};

export const isLastYear = (date: Date | string): boolean => {
	const lastYearStart = startOfYear(subYears(new Date(), 1));
	const lastYearEnd = endOfYear(subYears(new Date(), 1));

	return isWithinInterval(new Date(date), {
		start: lastYearStart,
		end: lastYearEnd,
	});
};

export const monthRange: DateRange = {
	from: startOfMonth(new Date()),
	to: endOfMonth(new Date()),
};

export const weekRange: DateRange = {
	from: startOfWeek(new Date()),
	to: endOfWeek(new Date()),
};

export const getCompactTimeAgo = (date: Date): string => {
	const now = Date.now();
	const diffInSeconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

	if (diffInSeconds < 60) {
		return '1m';
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return `${diffInDays}d`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	if (diffInMonths < 12) {
		return `${diffInMonths}mo`;
	}

	const diffInYears = Math.floor(diffInMonths / 12);
	return `${diffInYears}y`;
};

export const formatDateForDisplay = (
	dateValue?: Date | string | number | null
) => {
	if (dateValue === null || dateValue === undefined || dateValue === '')
		return '';
	const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
	if (Number.isNaN(date.getTime())) return '-';
	return format(date, 'dd-MM-yyyy');
};

export const parseDateLocal = (date: Date | string): Date => {
	if (date instanceof Date) return date;
	// Extract the YYYY-MM-DD portion (handles both "2026-02-11" and "2026-02-11T00:00:00.000Z")
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
	if (match) {
		return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	}
	return new Date(date);
};

export const parseDatePickerValue = (value?: string): Date | undefined => {
	if (!value) return undefined;

	// yyyy-MM-dd or ISO-like strings
	if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
		const date = parseDateLocal(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}

	// dd-MM-yyyy or dd/MM/yyyy (also allows 1-digit day/month)
	const match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(value);
	if (match) {
		const day = Number(match[1]);
		const month = Number(match[2]);
		const year = Number(match[3]);
		const date = new Date(year, month - 1, day);
		if (
			!Number.isNaN(date.getTime()) &&
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day
		) {
			return date;
		}
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

export const toYYYYMMDD = (date: Date): string => format(date, 'yyyy-MM-dd');

export const formatDateLabel = (dateStart?: string, dateEnd?: string) => {
	if (!dateStart && !dateEnd) return 'All time';
	// parseDateLocal, not new Date(): "2026-08-01" parses as UTC midnight, which
	// renders as Jul 31 for any viewer behind UTC
	const fmt = (s: string) => format(parseDateLocal(s), 'MMM d, yyyy');
	if (dateStart && dateEnd) return `${fmt(dateStart)} – ${fmt(dateEnd)}`;
	if (dateStart) return `From ${fmt(dateStart)}`;
	return `Until ${fmt(dateEnd ?? '')}`;
};

// ─── Timezone-aware day boundaries ────────────────────────────────────────────
// Date filters arrive as a plain "YYYY-MM-DD" calendar day picked in the user's
// browser — "August 1st" as *they* see it, with no timezone attached. Resolving
// it means reading that day as wall-clock time in their zone and converting to
// the UTC instants stored on the records:
//
//   "2026-08-01" + America/Denver      → 2026-08-01T06:00:00.000Z
//   "2026-08-01" + Asia/Calcutta       → 2026-07-31T18:30:00.000Z
//
// Anchoring to UTC instead (or applying the *server's* offset via setHours)
// slides the window off the user's day and drags in a partial neighbouring day.

export { BUSINESS_TIME_ZONE } from '@repo/constants';

export const isValidTimeZone = (timeZone?: string | null): boolean => {
	if (!timeZone) return false;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone });
		return true;
	} catch {
		return false;
	}
};

const resolveTimeZone = (timeZone?: string | null): string =>
	isValidTimeZone(timeZone) ? (timeZone as string) : DEFAULT_TIME_ZONE;

/** The "YYYY-MM-DD" portion of a date filter value. */
const toCalendarDay = (value: string): string | null =>
	/^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] ?? null;

/** UTC instant of 00:00:00.000 on that calendar day in `timeZone`. */
export const startOfDayInTimeZone = (
	value: string,
	timeZone?: string | null
): Date => {
	const day = toCalendarDay(value);
	if (!day) return new Date(Number.NaN);
	return fromZonedTime(`${day}T00:00:00.000`, resolveTimeZone(timeZone));
};

/** UTC instant of 23:59:59.999 on that calendar day in `timeZone`. */
export const endOfDayInTimeZone = (
	value: string,
	timeZone?: string | null
): Date => {
	const day = toCalendarDay(value);
	if (!day) return new Date(Number.NaN);
	return fromZonedTime(`${day}T23:59:59.999`, resolveTimeZone(timeZone));
};

/**
 * "YYYY-MM-DD" for the calendar day `date` falls on in `timeZone` — the key the
 * trend charts bucket on, so buckets line up with the user's days.
 */
export const formatDayKeyInTimeZone = (
	date: Date,
	timeZone?: string | null
): string => formatInTimeZone(date, resolveTimeZone(timeZone), 'yyyy-MM-dd');

// Day-keyed columns (daily analytics rollups) store a calendar day as UTC
// midnight rather than a real instant, so they must be matched on the day
// itself — applying a viewer's offset to them slides the window by a day.
export const startOfUtcDay = (value: string): Date =>
	startOfDayInTimeZone(value, DEFAULT_TIME_ZONE);

export const endOfUtcDay = (value: string): Date =>
	endOfDayInTimeZone(value, DEFAULT_TIME_ZONE);
