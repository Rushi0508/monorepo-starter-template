/**
 * "YYYY-MM" period arithmetic. Periods sort and compare lexicographically
 * because the month is zero-padded, so ordering never needs Date parsing.
 */

import { BUSINESS_TIME_ZONE, formatDayKeyInTimeZone } from '@repo/utils';

const PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isPeriod = (value: string): boolean => PERIOD.test(value);

/**
 * Formats a synthetic UTC-midnight date as "YYYY-MM". For period arithmetic
 * only — a real instant must be bucketed in the business timezone instead,
 * or the last evening of a month reads as the next one.
 */
export const toPeriod = (date: Date): string =>
	`${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, '0')}`;

/**
 * The month the business is currently in. Drives the plan month of a new plan
 * and which cells are still editable, so it has to close when Oregon closes,
 * not seven hours earlier when UTC does.
 */
export const currentPeriod = (): string =>
	formatDayKeyInTimeZone(new Date(), BUSINESS_TIME_ZONE).slice(0, 7);

/** Shifts a period by a whole number of months, forwards or backwards. */
export function addMonths(period: string, months: number): string {
	const [year, month] = period.split('-').map(Number) as [number, number];
	// Month is 1-based in the string and 0-based in Date, hence the -1.
	return toPeriod(new Date(Date.UTC(year, month - 1 + months, 1)));
}

/** Inclusive list of periods from `from` to `to`; empty when `to` precedes it. */
export function periodRange(from: string, to: string): string[] {
	const periods: string[] = [];
	let cursor = from;
	while (cursor <= to) {
		periods.push(cursor);
		cursor = addMonths(cursor, 1);
	}
	return periods;
}

/** Whole months from `from` to `to`; negative when `to` is earlier. */
export function monthsBetween(from: string, to: string): number {
	const [fy, fm] = from.split('-').map(Number) as [number, number];
	const [ty, tm] = to.split('-').map(Number) as [number, number];
	return (ty - fy) * 12 + (tm - fm);
}
