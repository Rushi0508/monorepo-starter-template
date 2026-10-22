'use client';

import type { InventorySkuRow } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import type { CustomColumnDef } from '@/components/general/CustomTable';

export const inventorySkuCols: CustomColumnDef<InventorySkuRow>[] = [
	{
		accessorKey: 'sku',
		header: 'SKU',
		enableSorting: true,
		cell: ({ row }) => <span className='font-medium'>{row.original.sku}</span>,
	},
	{
		accessorKey: 'description',
		header: 'Description',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-muted-foreground truncate max-w-50 block'>
				{row.original.description ?? '—'}
			</span>
		),
	},
	{
		accessorKey: 'onHand',
		header: 'On Hand',
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.onHand.toLocaleString()}</span>,
	},
	{
		accessorKey: 'committed',
		header: 'Committed',
		enableSorting: true,
		cell: ({ row }) => (
			<span>
				{row.original.committed > 0
					? row.original.committed.toLocaleString()
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'available',
		header: 'Available',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='font-semibold text-emerald-600'>
				{row.original.available.toLocaleString()}
			</span>
		),
	},
	{
		accessorKey: 'backordered',
		header: 'Backordered',
		enableSorting: true,
		cell: ({ row }) => (
			<span
				className={cn(
					row.original.backordered > 0
						? 'text-red-600 font-medium'
						: 'text-muted-foreground'
				)}
			>
				{row.original.backordered > 0
					? row.original.backordered.toLocaleString()
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'quarantined',
		header: 'Quarantined',
		enableSorting: true,
		cell: ({ row }) => (
			<span
				className={cn(
					row.original.quarantined > 0
						? 'text-yellow-600 font-medium'
						: 'text-muted-foreground'
				)}
			>
				{row.original.quarantined > 0
					? row.original.quarantined.toLocaleString()
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'earliestExpiry',
		header: 'Earliest Expiry',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{row.original.earliestExpiry
					? format(new Date(row.original.earliestExpiry), 'MMM d, yyyy')
					: '—'}
			</span>
		),
	},
];
