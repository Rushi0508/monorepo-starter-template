'use client';

import { ASNStatusEnum } from '@repo/enums/dist';
import type { AsnItem } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { ASN_STYLES } from '@/components/badge-style-config';
import { EnumBadge } from '@/components/general/CustomBadge';
import type { CustomColumnDef } from '@/components/general/CustomTable';

export const asnCols: CustomColumnDef<AsnItem>[] = [
	{
		accessorKey: 'asnNumber',
		header: 'ASN #',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='font-medium'>{row.original.asnNumber}</span>
		),
	},
	{
		accessorKey: 'poNumber',
		header: 'PO #',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{row.original.poNumber ?? '—'}
			</span>
		),
	},
	{
		accessorKey: 'sku',
		header: 'SKU',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='font-medium'>{row.original.sku ?? '—'}</span>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		enableSorting: false,
		cell: ({ row }) => (
			<EnumBadge
				value={row.original.status as ASNStatusEnum}
				className={cn(ASN_STYLES[row.original.status as ASNStatusEnum])}
				allCaps
			/>
		),
	},
	{
		accessorKey: 'sent',
		header: 'Sent',
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.sent.toLocaleString()}</span>,
	},
	{
		accessorKey: 'received',
		header: 'Received',
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.received.toLocaleString()}</span>,
	},
	{
		accessorKey: 'damaged',
		header: 'Damaged',
		enableSorting: true,
		cell: ({ row }) => (
			<span
				className={
					row.original.damaged > 0
						? 'text-red-600 font-medium'
						: 'text-muted-foreground'
				}
			>
				{row.original.damaged > 0 ? row.original.damaged.toLocaleString() : '—'}
			</span>
		),
	},
	{
		accessorKey: 'expectedDate',
		header: 'Expected',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{row.original.expectedDate
					? format(new Date(row.original.expectedDate), 'MMM d, yyyy')
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'actualDate',
		header: 'Arrived',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{row.original.actualDate
					? format(new Date(row.original.actualDate), 'MMM d, yyyy')
					: '—'}
			</span>
		),
	},
];
