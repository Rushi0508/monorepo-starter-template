'use client';
import { Button } from '@repo/ui/components/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@repo/ui/components/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { cn } from '@repo/ui/lib/utils';
import { Building2, CheckIcon, ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

interface ComboboxOption {
	value: string;
	label: string;
}

type ComboboxProps = Readonly<{
	options: ComboboxOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	emptyText?: string;
	className?: string;
	disabled?: boolean;
	allowManualInput?: boolean;
	isLoading?: boolean;
	fieldName?: string;
	searchPlaceholder?: string;
}>;

export function Combobox({
	options,
	value,
	onValueChange,
	placeholder = 'Select option...',
	emptyText = 'No options found.',
	className,
	disabled = false,
	allowManualInput = false,
	isLoading = false,
	fieldName = 'option',
	searchPlaceholder = 'Search for an option...',
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const [searchValue, setSearchValue] = React.useState('');

	const selectedOption = options.find((option) => option.value === value);

	const filteredOptions = searchValue
		? options.filter((option) =>
				option.label.toLowerCase().includes(searchValue.toLowerCase())
			)
		: options;

	const handleManualSelect = () => {
		if (searchValue.trim()) {
			onValueChange?.(searchValue.trim());
			setOpen(false);
			setSearchValue('');
		}
	};

	const showManualInput =
		allowManualInput && searchValue.trim() && filteredOptions.length === 0;

	const getDisplayValue = () => {
		if (isLoading) return 'Loading...';

		if (selectedOption) return selectedOption.label;

		if (allowManualInput && value) return value;

		return null;
	};

	const displayValue = getDisplayValue();

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					role='combobox'
					aria-expanded={open}
					className={cn(
						'w-full min-w-0 justify-between font-normal',
						!displayValue && 'text-muted-foreground',
						className
					)}
					disabled={disabled}
				>
					<span className='min-w-0 flex-1 truncate text-left'>
						{displayValue || placeholder}
					</span>
					<ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className='w-[--radix-popover-trigger-width] p-0'
				align='start'
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={searchPlaceholder}
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						{filteredOptions.length > 0 && (
							<CommandGroup>
								{filteredOptions.map((option) => (
									<CommandItem
										key={option.value}
										value={option.label}
										onSelect={() => {
											onValueChange?.(option.value);
											setOpen(false);
											setSearchValue('');
										}}
									>
										<CheckIcon
											className={cn(
												'mr-2 h-4 w-4',
												value === option.value ? 'opacity-100' : 'opacity-0'
											)}
										/>
										{option.label}
									</CommandItem>
								))}
							</CommandGroup>
						)}
						{showManualInput && (
							<CommandGroup>
								<CommandItem
									value={searchValue}
									onSelect={handleManualSelect}
									className='w-full cursor-pointer'
								>
									<Building2 className='text-muted-foreground mr-2 h-4 w-4 shrink-0' />
									<div className='flex min-w-0 flex-1 flex-col'>
										<span className='truncate font-medium'>
											Add "{searchValue.trim()}"
										</span>
										<span className='text-muted-foreground truncate text-sm'>
											Add this {fieldName} manually
										</span>
									</div>
								</CommandItem>
							</CommandGroup>
						)}
						{filteredOptions.length === 0 && (
							<CommandEmpty>{emptyText}</CommandEmpty>
						)}
						{showManualInput && (
							<div className='text-muted-foreground p-4 text-center text-sm'>
								No {fieldName} found. Press Enter or click above to add as new
								option.
							</div>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
