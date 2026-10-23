'use client';

import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { cn } from '@repo/ui/lib/utils';
import { parseDatePickerValue } from '@repo/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

type DatePickerProps = Readonly<{
	value?: string;
	onChange?: (date: string | undefined) => void;
	placeholder?: string;
	className?: string;
	text?: string;
	buttonClassName?: string;

	disabled?: boolean;
	allowClear?: boolean;
	minDate?: Date;
	maxDate?: Date;
}>;

const toYYYYMMDD = (date: Date): string => format(date, 'yyyy-MM-dd');

export function DatePicker({
	value,
	onChange,
	placeholder = 'Select date',
	className,
	text,
	buttonClassName,
	disabled = false,
	allowClear = true,
	minDate,
	maxDate,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const selectedDate = useMemo(() => parseDatePickerValue(value), [value]);
	const displayValue = value || placeholder;

	const handleSelect = (date: Date | undefined) => {
		onChange?.(date ? toYYYYMMDD(date) : undefined);
		setOpen(false);
	};

	const handleClear = () => {
		onChange?.(undefined);
	};

	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						id='date-picker'
						disabled={disabled}
						className={cn(
							'placeholder:text-muted-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 justify-between rounded-md border bg-transparent px-3 py-1 text-sm font-normal shadow-xs transition-[color,box-shadow] hover:bg-transparent',
							'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
							buttonClassName
						)}
					>
						<span className={cn(!value && 'text-muted-foreground')}>
							{displayValue}
						</span>
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
							mode='single'
							endMonth={new Date(2100, 11)}
							selected={selectedDate}
							defaultMonth={selectedDate}
							onSelect={handleSelect}
							captionLayout='dropdown'
							disabled={(date) => {
								if (minDate && date < minDate) return true;
								if (maxDate && date > maxDate) return true;
								return false;
							}}
						/>

						{allowClear && (
							<Button
								variant='ghost'
								size='sm'
								onClick={handleClear}
								type='button'
								disabled={disabled}
							>
								Clear
							</Button>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
