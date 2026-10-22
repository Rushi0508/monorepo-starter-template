'use client';

import type { FolkCompanyMappingType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import LoadingButton from '@/components/general/LoadingButton';
import {
	FOLK_CUSTOMER_SEARCH_MIN_CHARS,
	useFolkCustomerSearch,
	useLinkFolkCustomer,
} from '@/queries';

interface FolkCustomerPickerDialogProps {
	mapping: FolkCompanyMappingType;
	onClose: () => void;
}

const FolkCustomerPickerDialog = ({
	mapping,
	onClose,
}: FolkCustomerPickerDialogProps) => {
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, 300);
	const [selectedCustomerId, setSelectedCustomerId] = useState('');

	const {
		data: customerOptions,
		isLoading: isFirstSearch,
		isPlaceholderData,
	} = useFolkCustomerSearch({
		search: debouncedSearch,
		excludeMappingId: mapping.id,
	});
	const { mutate: linkCustomer, isPending: isLinking } = useLinkFolkCustomer();

	const isAdding = (mapping.customers ?? []).length > 0;
	const needsMoreChars =
		debouncedSearch.trim().length < FOLK_CUSTOMER_SEARCH_MIN_CHARS;
	const results = customerOptions ?? [];
	const noResults =
		!needsMoreChars &&
		!isFirstSearch &&
		!isPlaceholderData &&
		results.length === 0;

	const handleSubmit = () => {
		if (!selectedCustomerId) return;
		linkCustomer(
			{ id: mapping.id, data: { customerId: selectedCustomerId } },
			{ onSuccess: onClose }
		);
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>
						{isAdding
							? `Add customer to ${mapping.folkCompanyName}`
							: `Map ${mapping.folkCompanyName}`}
					</DialogTitle>
				</DialogHeader>

				<Input
					placeholder={`Search Sauero customers (min ${FOLK_CUSTOMER_SEARCH_MIN_CHARS} characters)...`}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>

				<div className='max-h-64 space-y-1 overflow-y-auto'>
					{needsMoreChars && (
						<p className='text-sm text-muted-foreground'>
							Type at least {FOLK_CUSTOMER_SEARCH_MIN_CHARS} characters to
							search
						</p>
					)}
					{!needsMoreChars && isFirstSearch && (
						<p className='text-sm text-muted-foreground'>Searching...</p>
					)}
					{!needsMoreChars && (
						<div
							className={cn(
								'space-y-1 transition-opacity',
								isPlaceholderData && 'opacity-60'
							)}
						>
							{results.map((option) => (
								<button
									key={option.id}
									type='button'
									className={cn(
										'flex w-full flex-col rounded-md border px-3 py-2 text-left text-sm',
										selectedCustomerId === option.id &&
											'border-primary bg-muted'
									)}
									onClick={() => setSelectedCustomerId(option.id)}
								>
									<span className='font-medium'>
										{option.displayName || option.id}
									</span>
									{option.email && (
										<span className='text-xs text-muted-foreground'>
											{option.email}
										</span>
									)}
								</button>
							))}
						</div>
					)}
					{noResults && (
						<p className='text-sm text-muted-foreground'>No customers found</p>
					)}
				</div>

				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancel
					</Button>
					<LoadingButton
						isLoading={isLinking}
						disabled={!selectedCustomerId || isLinking}
						onClick={handleSubmit}
					>
						{isAdding ? 'Add customer' : 'Confirm mapping'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default FolkCustomerPickerDialog;
