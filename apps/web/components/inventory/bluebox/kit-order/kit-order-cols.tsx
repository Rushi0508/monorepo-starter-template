'use client';

import type { KitOrderItem } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { KIT_ORDER_STYLES } from '@/components/badge-style-config';
import { EnumBadge } from '@/components/general/CustomBadge';
import type { CustomColumnDef } from '@/components/general/CustomTable';

const formatDate = (iso: string | null) =>
	iso ? format(new Date(iso), 'MMM d, yyyy') : '—';

export const kitOrderCols: CustomColumnDef<KitOrderItem>[] = [
	{
		accessorKey: 'kitOrderNumber',
		header: 'Kit #',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='font-medium'>{row.original.kitOrderNumber}</span>
		),
	},
	{
		accessorKey: 'sku',
		header: 'SKU',
		enableSorting: false,
		cell: ({ row }) => (
			<div className='min-w-0 max-w-72'>
				<p className='font-medium truncate'>{row.original.sku ?? '—'}</p>
				{row.original.kitDescription && (
					<p className='text-xs text-muted-foreground truncate'>
						{row.original.kitDescription}
					</p>
				)}
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		enableSorting: false,
		cell: ({ row }) => (
			<EnumBadge
				value={row.original.status}
				className={cn(KIT_ORDER_STYLES[row.original.status])}
				allCaps
			/>
		),
	},
	{
		accessorKey: 'quantity',
		header: 'Ordered',
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.quantity.toLocaleString()}</span>,
	},
	{
		accessorKey: 'quantityBuilt',
		header: 'Built',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-emerald-600 font-medium'>
				{row.original.quantityBuilt.toLocaleString()}
			</span>
		),
	},
	{
		accessorKey: 'percentComplete',
		header: 'Progress',
		enableSorting: true,
		cell: ({ row }) => (
			<div className='flex items-center gap-2 min-w-28'>
				<div className='h-1.5 flex-1 rounded-full bg-muted overflow-hidden'>
					<div
						className='h-full bg-emerald-500'
						style={{ width: `${Math.min(100, row.original.percentComplete)}%` }}
					/>
				</div>
				<span className='text-xs text-muted-foreground w-10 text-right'>
					{Math.round(row.original.percentComplete)}%
				</span>
			</div>
		),
	},
	{
		accessorKey: 'requestedDate',
		header: 'Requested',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{formatDate(row.original.requestedDate)}
			</span>
		),
	},
	{
		accessorKey: 'completedDate',
		header: 'Completed',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{formatDate(row.original.completedDate)}
			</span>
		),
	},
];
