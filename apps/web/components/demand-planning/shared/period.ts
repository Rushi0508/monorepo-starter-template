/**
 * Plan windows are month-grained and stored as "YYYY-MM" strings, which sort
 * and compare lexicographically — so no Date maths is needed to order them.
 */

import { BUSINESS_TIME_ZONE, formatDayKeyInTimeZone } from '@repo/utils';

/**
 * The current month, the default cycle for a new plan. Read in the business
 * timezone rather than the viewer's, so the dialog cannot offer a month the
 * server would refuse to stamp.
 */
export function currentPeriod(): string {
	return formatDayKeyInTimeZone(new Date(), BUSINESS_TIME_ZONE).slice(0, 7);
}

/** Shifts a period by a whole number of months. */
export function addMonths(period: string, months: number): string {
	const [year, month] = period.split('-').map(Number);
	// Month is 1-based in the string and 0-based in Date, hence the -1/+1.
	const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1 + months, 1));
	const shifted = `${date.getUTCMonth() + 1}`.padStart(2, '0');
	return `${date.getUTCFullYear()}-${shifted}`;
}

/** "2026-08" → "Aug 2026" */
export function periodLabel(period?: string): string {
	if (!period) return '—';
	const [year, month] = period.split('-').map(Number);
	const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, 1));
	return date.toLocaleString('en-US', {
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	});
}

/** Inclusive month count between two periods. */
export function monthsBetween(from: string, to: string): number {
	const [fy, fm] = from.split('-').map(Number);
	const [ty, tm] = to.split('-').map(Number);
	return ((ty ?? 0) - (fy ?? 0)) * 12 + ((tm ?? 0) - (fm ?? 0)) + 1;
}

/**
 * Returns `period`, or `min` when it falls before it. "YYYY-MM" sorts
 * lexicographically, so this is a plain string comparison.
 */
export function clampPeriod(period: string, min?: string): string {
	return min && period < min ? min : period;
}

/** "2026-09" → "September 2026". Used where a month reads as prose. */
export function periodLabelLong(period: string): string {
	const [year, month] = period.split('-').map(Number);
	const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, 1));
	return date.toLocaleString('en-US', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	});
}

/** The name a new plan starts with, e.g. "September 2026 demand plan". */
export const defaultPlanName = (period: string): string =>
	`${periodLabelLong(period)} demand plan`;

/** "2026-08" → "Aug '26" */
export function periodLabelShort(period: string): string {
	return `${periodLabel(period).slice(0, 3)} '${period.slice(2, 4)}`;
}
