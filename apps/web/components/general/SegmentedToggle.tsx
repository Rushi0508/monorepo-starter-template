'use client';

import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group';
import { cn } from '@repo/ui/lib/utils';

export interface SegmentedToggleOption<T extends string> {
	value: T;
	/** Text shown on the segment — keep it short, these sit in card headers */
	label: string;
	/** Longer text for the tooltip and screen readers */
	title?: string;
}

interface SegmentedToggleProps<T extends string> {
	value: T;
	onChange: (value: T) => void;
	options: SegmentedToggleOption<T>[];
	ariaLabel?: string;
	className?: string;
	optionsClassName?: string;
}

/**
 * The small segmented control used in chart and table card headers to switch
 * one view between a handful of options. One implementation so every header
 * across the app renders the same control.
 */
export function SegmentedToggle<T extends string>({
	value,
	onChange,
	options,
	ariaLabel,
	className,
	optionsClassName,
}: SegmentedToggleProps<T>) {
	return (
		<ToggleGroup
			type='single'
			variant='outline'
			size='sm'
			value={value}
			onValueChange={(next) => {
				// Radix emits '' when the active item is clicked again
				if (next) onChange(next as T);
			}}
			aria-label={ariaLabel}
			className={className}
		>
			{options.map((option) => (
				<ToggleGroupItem
					key={option.value}
					value={option.value}
					aria-label={option.title ?? option.label}
					title={option.title ?? option.label}
					className={cn('h-7 min-w-7 px-2 text-xs', optionsClassName)}
				>
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

export default SegmentedToggle;
