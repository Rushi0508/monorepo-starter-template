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
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export interface SearchableSelectOption {
	label: string;
	value: string;
	icon?: ReactNode;
	component?: ReactNode;
}

interface SearchableSelectProps {
	options: SearchableSelectOption[];
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	disabled?: boolean;
	className?: string;
	isLoading?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

const SearchableSelect = ({
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	searchPlaceholder = 'Search...',
	emptyMessage = 'No results found.',
	disabled = false,
	className,
	size = 'md',
	isLoading = false,
}: SearchableSelectProps) => {
	const [open, setOpen] = useState(false);

	const selectedOption = options.find((option) => option.value === value);

	const displayValue = isLoading
		? 'Loading...'
		: selectedOption
			? selectedOption.label
			: placeholder;

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant='subtle'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						'w-full min-w-0 justify-between overflow-hidden font-normal',
						size === 'sm' && 'h-8 text-sm',
						size === 'md' && 'h-9 text-sm',
						size === 'lg' && 'h-10 text-sm',
						!value && 'text-muted-foreground',
						className
					)}
				>
					<span className='flex min-w-0 items-center gap-2'>
						{selectedOption?.icon}
						<span className='truncate'>{displayValue}</span>
					</span>
					<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className='w-[--radix-popover-trigger-width] p-0'
				align='start'
			>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.label}
									onSelect={() => {
										onChange(option.value);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											value === option.value ? 'opacity-100' : 'opacity-0'
										)}
									/>
									{option.component ? (
										option.component
									) : (
										<>
											{option.icon}
											{option.label}
										</>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default SearchableSelect;
