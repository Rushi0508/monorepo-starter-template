'use client';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { clampPeriod } from './period';

/**
 * Picks a "YYYY-MM" period as a month and a year.
 *
 * Deliberately not `<input type="month">` — Safari has no month picker and
 * silently degrades it to a free-text box, which would let someone type a
 * period the API rejects.
 */

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

const pad = (n: number) => `${n}`.padStart(2, '0');

interface MonthYearPickerProps {
	/** "YYYY-MM" */
	value: string;
	onChange: (period: string) => void;
	/** Earliest selectable period, "YYYY-MM". Earlier options are disabled. */
	min?: string;
	/** How many years past `min` to offer. */
	yearsAhead?: number;
	disabled?: boolean;
}

export function MonthYearPicker({
	value,
	onChange,
	min,
	yearsAhead = 5,
	disabled,
}: MonthYearPickerProps) {
	const [yearPart, monthPart] = value.split('-');
	const year = Number(yearPart);
	const month = Number(monthPart);

	const [minYearPart, minMonthPart] = (min ?? '').split('-');
	const minYear = min ? Number(minYearPart) : year;
	const minMonth = min ? Number(minMonthPart) : 1;

	const years = Array.from({ length: yearsAhead + 1 }, (_, i) => minYear + i);

	/** In the first selectable year, months before the minimum are unavailable. */
	const isMonthDisabled = (candidate: number, forYear: number) =>
		Boolean(min) && forYear === minYear && candidate < minMonth;

	// Moving back to the first year can strand the month before the minimum, so
	// pull it forward rather than emitting a period the API would reject.
	const handleYearChange = (nextYear: string) =>
		onChange(clampPeriod(`${nextYear}-${pad(month)}`, min));

	return (
		<div className='flex gap-2'>
			<Select
				value={String(month)}
				onValueChange={(next) => onChange(`${year}-${pad(Number(next))}`)}
				disabled={disabled}
			>
				<SelectTrigger className='flex-1'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{MONTHS.map((label, index) => (
						<SelectItem
							key={label}
							value={String(index + 1)}
							disabled={isMonthDisabled(index + 1, year)}
						>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={String(year)}
				onValueChange={handleYearChange}
				disabled={disabled}
			>
				<SelectTrigger className='w-[110px]'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{years.map((candidate) => (
						<SelectItem key={candidate} value={String(candidate)}>
							{candidate}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export default MonthYearPicker;
