'use client';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from '@repo/ui/components/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { Separator } from '@repo/ui/components/separator';
import { cn } from '@repo/ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
	CheckIcon,
	ChevronDown,
	WandSparkles,
	XCircle,
	XIcon,
} from 'lucide-react';
import * as React from 'react';

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
	'm-1 transition ease-in-out delay-150   duration-300',
	{
		variants: {
			variant: {
				default:
					'border-foreground/10 text-foreground bg-muted hover:bg-muted/80',
				secondary:
					'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
				destructive:
					'border-transparent bg-destructive hover:bg-destructive/80 text-white',
				inverted: 'inverted',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof multiSelectVariants> {
	/**
	 * An array of option objects to be displayed in the multi-select component.
	 * Each option object has a label, value, and an optional icon.
	 */
	options: {
		/** The text to display for the option. */
		label: string;
		/** The unique value associated with the option. */
		value: string;
		/** Optional icon component to display alongside the option. */
		icon?: React.ComponentType<{ className?: string }>;
		/** Whether the option is disabled */
		disabled?: boolean;
		/** Always selected; the user cannot remove it */
		locked?: boolean;
	}[];

	/**
	 * Callback function triggered when the selected values change.
	 * Receives an array of the new selected values.
	 */
	onValueChange: (value: string[]) => void;

	/** The default selected values when the component mounts. */
	defaultValue?: string[];

	/**
	 * Placeholder text to be displayed when no values are selected.
	 * Optional, defaults to "Select options".
	 */
	placeholder?: string;

	/**
	 * Animation duration in seconds for the visual effects (e.g., bouncing badges).
	 * Optional, defaults to 0 (no animation).
	 */
	animation?: number;

	/**
	 * Maximum number of items to display. Extra selected items will be summarized.
	 * Optional, defaults to 3.
	 */
	maxCount?: number;

	/**
	 * The modality of the popover. When set to true, interaction with outside elements
	 * will be disabled and only popover content will be visible to screen readers.
	 * Defaults to true so the option list stays scrollable when the multi-select is
	 * rendered inside a modal dialog (a non-modal popover is portalled outside the
	 * dialog's scroll lock, which swallows wheel/touch scrolling).
	 * Optional, defaults to true.
	 */
	modalPopover?: boolean;

	/**
	 * If true, renders the multi-select component as a child of another component.
	 * Optional, defaults to false.
	 */
	asChild?: boolean;

	/**
	 * Additional class names to apply custom styles to the multi-select component.
	 * Optional, can be used to add custom styles.
	 */
	className?: string;

	/**
	 * If true, the select all option will be disabled.
	 * Optional, defaults to false.
	 */
	disableSelectAll?: boolean;

	/** Optional callback for when search input changes */
	onSearch?: (search: string) => void;

	/** Optional placeholder for the search input */
	searchPlaceholder?: string;

	/** Optional callback for when search input changes */
	shouldFilter?: boolean;

	/** If true, prevents badges from wrapping and clips overflow. Defaults to false. */
	compact?: boolean;
}

export const MultiSelect = React.forwardRef<
	HTMLButtonElement,
	MultiSelectProps
>(
	(
		{
			options,
			onValueChange,
			variant,
			defaultValue = [],
			placeholder = 'Select options',
			animation = 0,
			maxCount = 3,
			modalPopover = true,
			className,
			disableSelectAll = false,
			onSearch,
			searchPlaceholder = 'Search...',
			shouldFilter = true,
			compact = false,
			...props
		},
		ref
	) => {
		const [selectedValues, setSelectedValues] =
			React.useState<string[]>(defaultValue);
		const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
		const [isAnimating, setIsAnimating] = React.useState(false);

		React.useEffect(() => {
			setSelectedValues(defaultValue);
		}, [defaultValue]);

		const isLocked = (value: string) =>
			options.some((o) => o.value === value && o.locked);

		const handleInputKeyDown = (
			event: React.KeyboardEvent<HTMLInputElement>
		) => {
			if (event.key === 'Enter') {
				setIsPopoverOpen(true);
			} else if (
				event.key === 'Backspace' &&
				!event.currentTarget.value &&
				!isLocked(selectedValues.at(-1) ?? '')
			) {
				const newSelectedValues = [...selectedValues];
				newSelectedValues.pop();
				setSelectedValues(newSelectedValues);
				onValueChange(newSelectedValues);
			}
		};

		const toggleOption = (option: string) => {
			if (isLocked(option)) return;
			const newSelectedValues = selectedValues.includes(option)
				? selectedValues.filter((value) => value !== option)
				: [...selectedValues, option];
			setSelectedValues(newSelectedValues);
			onValueChange(newSelectedValues);
		};

		const handleClear = () => {
			const lockedValues = selectedValues.filter(isLocked);
			setSelectedValues(lockedValues);
			onValueChange(lockedValues);
		};

		const handleTogglePopover = () => {
			setIsPopoverOpen((prev) => !prev);
		};

		const clearExtraOptions = () => {
			const newSelectedValues = selectedValues.slice(0, maxCount);
			setSelectedValues(newSelectedValues);
			onValueChange(newSelectedValues);
		};

		const toggleAll = () => {
			if (
				selectedValues.length === options.filter((opt) => !opt.disabled).length
			) {
				handleClear();
			} else {
				const allValues = options
					.filter((opt) => !opt.disabled)
					.map((option) => option.value);
				setSelectedValues(allValues);
				onValueChange(allValues);
			}
		};

		return (
			<Popover
				open={isPopoverOpen}
				onOpenChange={setIsPopoverOpen}
				modal={modalPopover}
			>
				<PopoverTrigger asChild>
					<Button
						ref={ref}
						{...props}
						variant='subtle'
						onClick={handleTogglePopover}
						className={cn(
							'flex h-auto min-h-10 w-full items-center justify-between rounded-md border border-input bg-card p-1 shadow-xs hover:bg-card dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-auto',
							compact && 'overflow-hidden',
							className
						)}
					>
						{selectedValues.length > 0 ? (
							<div className='flex w-full items-center justify-between'>
								<div
									className={cn(
										'flex items-center',
										compact ? 'flex-nowrap overflow-hidden' : 'flex-wrap'
									)}
								>
									{selectedValues.slice(0, maxCount).map((value) => {
										const option = options.find((o) => o.value === value);
										const IconComponent = option?.icon;
										return (
											<Badge
												key={value}
												className={cn(
													isAnimating ? 'animate-bounce' : '',
													multiSelectVariants({ variant }),
													compact && 'min-w-0 shrink'
												)}
												style={{ animationDuration: `${animation}s` }}
											>
												{IconComponent && (
													<IconComponent className='mr-2 h-4 w-4' />
												)}
												{compact ? (
													<span className='truncate'>{option?.label}</span>
												) : (
													option?.label
												)}
												{!option?.locked && (
													<XCircle
														className='relative z-10 ml-2 h-4 w-4 cursor-pointer'
														style={{ pointerEvents: 'auto' }}
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
															toggleOption(value);
														}}
													/>
												)}
											</Badge>
										);
									})}
									{selectedValues.length > maxCount && (
										<Badge
											className={cn(
												'border-foreground/1 text-foreground bg-transparent hover:bg-transparent',
												isAnimating ? 'animate-bounce' : '',
												multiSelectVariants({ variant }),
												compact && 'shrink-0'
											)}
											style={{ animationDuration: `${animation}s` }}
										>
											{`+ ${selectedValues.length - maxCount} more`}
											<XCircle
												className='relative z-10 ml-2 h-4 w-4 cursor-pointer'
												style={{ pointerEvents: 'auto' }}
												onClick={(event) => {
													event.preventDefault();
													event.stopPropagation();
													clearExtraOptions();
												}}
											/>
										</Badge>
									)}
								</div>
								<div className='flex items-center justify-between'>
									<XIcon
										className='text-muted-foreground mx-2 h-4 cursor-pointer'
										onClick={(event) => {
											event.preventDefault();
											event.stopPropagation();
											handleClear();
										}}
									/>
									<Separator
										orientation='vertical'
										className='flex h-full min-h-6'
									/>
									<ChevronDown className='text-muted-foreground mx-2 h-4 cursor-pointer' />
								</div>
							</div>
						) : (
							<div className='mx-auto flex w-full items-center justify-between'>
								<span className='text-foreground mx-3 text-sm font-normal'>
									{placeholder}
								</span>
								<ChevronDown className='text-muted-foreground mx-2 h-4 cursor-pointer' />
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className='w-auto p-0'
					align='start'
					onEscapeKeyDown={() => setIsPopoverOpen(false)}
				>
					<Command shouldFilter={shouldFilter}>
						<CommandInput
							placeholder={searchPlaceholder}
							onKeyDown={handleInputKeyDown}
							onValueChange={(value) => onSearch?.(value)}
						/>
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								{!disableSelectAll && (
									<CommandItem
										key='all'
										onSelect={toggleAll}
										className='cursor-pointer'
									>
										<div
											className={cn(
												'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
												selectedValues.length === options.length
													? 'bg-primary text-primary-foreground'
													: 'opacity-50 [&_svg]:invisible'
											)}
										>
											<CheckIcon className='text-primary-foreground h-4 w-4' />
										</div>
										<span>(Select All)</span>
									</CommandItem>
								)}
								{options && options.length === 0 && (
									<CommandItem className='cursor-pointer justify-center'>
										<span className='text-muted-foreground px-4 text-sm'>
											No options available, modify the search
										</span>
									</CommandItem>
								)}
								{options.map((option) => {
									const isSelected = selectedValues.includes(option.value);
									return (
										<CommandItem
											key={option.value}
											onSelect={() =>
												!option.disabled && toggleOption(option.value)
											}
											className={cn(
												'cursor-pointer',
												option.locked && 'cursor-default opacity-70',
												option.disabled &&
													'pointer-events-none cursor-not-allowed opacity-50'
											)}
										>
											<div
												className={cn(
													'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
													isSelected
														? 'bg-primary text-primary-foreground'
														: 'opacity-50 [&_svg]:invisible'
												)}
											>
												<CheckIcon className='text-primary-foreground h-4 w-4' />
											</div>
											{option.icon && (
												<option.icon className='text-muted-foreground mr-2 h-4 w-4' />
											)}
											<span>{option.label}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<div className='flex items-center justify-between'>
									{selectedValues.length > 0 && (
										<>
											<CommandItem
												onSelect={handleClear}
												className='flex-1 cursor-pointer justify-center'
											>
												Clear
											</CommandItem>
											<Separator
												orientation='vertical'
												className='flex h-full min-h-6'
											/>
										</>
									)}
									<CommandItem
										onSelect={() => setIsPopoverOpen(false)}
										className='max-w-full flex-1 cursor-pointer justify-center'
									>
										Close
									</CommandItem>
								</div>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
				{animation > 0 && selectedValues.length > 0 && (
					<WandSparkles
						className={cn(
							'bg-background text-foreground my-2 h-3 w-3 cursor-pointer',
							isAnimating ? '' : 'text-muted-foreground'
						)}
						onClick={() => setIsAnimating(!isAnimating)}
					/>
				)}
			</Popover>
		);
	}
);

MultiSelect.displayName = 'MultiSelect';
