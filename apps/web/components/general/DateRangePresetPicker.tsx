'use client';

import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { Separator } from '@repo/ui/components/separator';
import { cn } from '@repo/ui/lib/utils';
import {
	endOfDay,
	endOfMonth,
	format,
	isSameDay,
	startOfDay,
	startOfMonth,
	startOfYear,
	subMonths,
} from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

// ─── Presets ──────────────────────────────────────────────────────────────────

interface Preset {
	label: string;
	range: () => DateRange;
}

function buildPresets(): Preset[] {
	const today = new Date();
	return [
		{
			label: 'This month',
			range: () => ({ from: startOfMonth(today), to: endOfMonth(today) }),
		},
		{
			label: 'Last month',
			range: () => {
				const last = subMonths(today, 1);
				return { from: startOfMonth(last), to: endOfMonth(last) };
			},
		},
		{
			label: 'Year to date',
			range: () => ({ from: startOfYear(today), to: endOfDay(today) }),
		},
	];
}

function matchesPreset(preset: Preset, value: DateRange | undefined): boolean {
	if (!value?.from || !value?.to) return false;
	const { from, to } = preset.range();
	if (!from || !to) return false;
	return isSameDay(value.from, from) && isSameDay(value.to, to);
}

// ─── Display label ─────────────────────────────────────────────────────────────

function displayLabel(
	value: DateRange | undefined,
	placeholder: string
): string {
	if (!value?.from) return placeholder;
	const presets = buildPresets();
	const matched = presets.find((p) => matchesPreset(p, value));
	if (matched) return matched.label;
	if (value.to) {
		return `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`;
	}
	return format(value.from, 'MMM d, yyyy');
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface DateRangePresetPickerProps {
	value?: DateRange;
	onChange?: (range: DateRange | undefined) => void;
	placeholder?: string;
	className?: string;
	buttonClassName?: string;
	/** Section label shown above the preset list inside the popover */
	sectionLabel?: string;
}

export function DateRangePresetPicker({
	value,
	onChange,
	placeholder = 'Select time period',
	className,
	buttonClassName,
	sectionLabel,
}: DateRangePresetPickerProps) {
	const [open, setOpen] = React.useState(false);
	const [draft, setDraft] = React.useState<DateRange | undefined>(value);
	const wasOpen = React.useRef(false);
	const PRESETS = React.useMemo(() => buildPresets(), []);

	// Sync draft when popover opens
	React.useEffect(() => {
		if (open && !wasOpen.current) {
			setDraft(value);
		}
		wasOpen.current = open;
	}, [open, value]);

	const handlePreset = (preset: Preset) => {
		const range = preset.range();
		onChange?.(range);
		setOpen(false);
	};

	const handleCalendarSelect = (range: DateRange | undefined) => {
		setDraft(range);
	};

	const handleApply = () => {
		if (!draft) {
			onChange?.(undefined);
			setOpen(false);
			return;
		}

		const fromDate = draft.from ?? draft.to;
		const toDate = draft.to ?? draft.from;

		onChange?.(
			fromDate && toDate
				? {
						from: startOfDay(fromDate),
						to: endOfDay(toDate),
					}
				: undefined
		);

		setOpen(false);
	};

	const handleClear = () => {
		setDraft(undefined);
	};

	const handleCancel = () => {
		setDraft(value);
		setOpen(false);
	};

	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						className={cn(
							'shadow-xs flex h-9 w-full min-w-fit justify-between gap-4 font-normal',
							buttonClassName
						)}
					>
						{displayLabel(value, placeholder)}
						<CalendarIcon className='h-4 w-4 shrink-0' />
					</Button>
				</PopoverTrigger>

				<PopoverContent className='w-auto p-0' align='start'>
					{/* ── Presets section ─────────────────────────────────── */}
					<div className='px-1 py-2'>
						{sectionLabel && (
							<p className='text-muted-foreground mb-1 px-2 py-1 text-[10px] font-semibold tracking-widest uppercase'>
								{sectionLabel}
							</p>
						)}
						<div className='flex flex-col'>
							{PRESETS.map((preset) => {
								const active = matchesPreset(preset, value);
								return (
									<button
										key={preset.label}
										type='button'
										onClick={() => handlePreset(preset)}
										className={cn(
											'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
											'hover:bg-accent hover:text-accent-foreground text-left',
											active && 'bg-accent/60 font-medium'
										)}
									>
										{preset.label}
										{active && <Check className='h-3.5 w-3.5 text-primary' />}
									</button>
								);
							})}
						</div>
					</div>

					<Separator />

					{/* ── Custom range section ─────────────────────────────── */}
					<div className='px-1 py-2'>
						<p className='text-muted-foreground mb-1 px-2 py-1 text-[10px] font-semibold tracking-widest uppercase'>
							Custom range
						</p>
						<Calendar
							mode='range'
							selected={draft}
							onSelect={handleCalendarSelect}
							numberOfMonths={1}
							className='px-1'
						/>
						{draft?.from && !draft?.to && (
							<p className='text-muted-foreground px-3 pb-1 text-xs'>
								Select an end date
							</p>
						)}
						<div className='mt-1 flex items-center justify-between px-2 pb-1'>
							<Button
								variant='ghost'
								size='sm'
								onClick={handleClear}
								type='button'
							>
								Clear
							</Button>
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={handleCancel}
									type='button'
								>
									Cancel
								</Button>
								<Button size='sm' onClick={handleApply} type='button'>
									Apply
								</Button>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
