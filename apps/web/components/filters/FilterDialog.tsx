'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@repo/ui/components/dialog';
import { Separator } from '@repo/ui/components/separator';
import { Filter, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterDialogProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	activeFiltersCount: number;
	onApply: () => void;
	onClearAll: () => void;
	applyDisabled?: boolean;
	title?: string;
	description?: string;
	children: ReactNode;
	trigger?: ReactNode;
}

export const FilterDialog = ({
	isOpen,
	setIsOpen,
	activeFiltersCount,
	onApply,
	onClearAll,
	applyDisabled = false,
	title = 'Filters',
	description = 'Filter by various criteria',
	children,
	trigger,
}: FilterDialogProps) => {
	const hasActiveFilters = activeFiltersCount > 0;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<Button variant='outline' className='flex items-center gap-2'>
						<Filter className='h-4 w-4' />
						Filters
						{activeFiltersCount > 0 && (
							<Badge variant='secondary' className='ml-1 px-1.5 py-0'>
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-2'>{children}</div>

				<Separator className='w-full' />
				<DialogFooter>
					<div className='flex w-full items-center justify-between'>
						<div>
							{hasActiveFilters && (
								<Button
									variant='ghost'
									size='sm'
									onClick={onClearAll}
									className='text-muted-foreground flex items-center gap-2'
								>
									<X className='h-4 w-4' />
									Clear All
								</Button>
							)}
						</div>
						<div className='flex gap-2'>
							<Button variant='outline' onClick={() => setIsOpen(false)}>
								Cancel
							</Button>
							<Button onClick={onApply} disabled={applyDisabled}>
								Apply
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
