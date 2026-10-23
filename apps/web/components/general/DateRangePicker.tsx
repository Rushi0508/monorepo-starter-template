'use client';

import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { cn } from '@repo/ui/lib/utils';
import { endOfDay, format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
	value?: DateRange;
	onChange?: (date: DateRange | undefined) => void;
	placeholder?: string;
	className?: string;
	text?: string;
	buttonClassName?: string;
}

export function DateRangePicker({
	value,
	onChange,
	placeholder = 'Select time period',
	className,
	text,
	buttonClassName,
}: DateRangePickerProps) {
	const [open, setOpen] = React.useState(false);
	const [draft, setDraft] = React.useState<DateRange | undefined>(value);
	const wasOpen = React.useRef(false);

	//This is actually a workaround to ensure that the initial value is set correctly when the popover opens.
	//If the popover is opened for the first time, we set the internal value to the initial value.
	React.useEffect(() => {
		if (open && !wasOpen.current) {
			setDraft(value);
		}
		wasOpen.current = open;
	}, [open, value]);

	const displayValue =
		value?.from && value?.to
			? `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
			: value?.from
				? format(value.from, 'MMM d, yyyy')
				: placeholder;

	const handleSelect = (range: DateRange | undefined) => {
		setDraft(range);
	};

	const handleClear = () => {
		setDraft(undefined);
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
						id='date-picker'
						className={cn(
							'shadow-xs flex w-full min-w-fit justify-between gap-4 font-normal h-9',
							buttonClassName
						)}
					>
						{displayValue}
						<CalendarIcon className='h-4 w-4' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<div className='flex flex-col gap-2 p-2'>
						{text && (
							<span className='text-muted-foreground mb-1 text-center text-sm font-medium'>
								{text}
							</span>
						)}
						<Calendar
							mode='range'
							selected={draft}
							onSelect={handleSelect}
							numberOfMonths={1}
						/>
						{draft?.from && !draft?.to && (
							<span className='text-muted-foreground px-2 text-xs'>
								Select an end date
							</span>
						)}
						<div className='mt-2 flex items-center justify-between gap-2'>
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
								<Button
									variant='default'
									size='sm'
									onClick={handleApply}
									type='button'
								>
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
