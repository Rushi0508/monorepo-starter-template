'use client';

import type { ProductionRunType } from '@repo/types';
import { format } from 'date-fns';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import { ProductionRunActions } from './ProductionRunActions';

export const productionRunCols: CustomColumnDef<ProductionRunType>[] = [
	{
		accessorKey: 'runNumber',
		header: 'RUN',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='font-medium'>{row.original.runNumber}</span>
		),
	},
	{
		accessorKey: 'sku',
		header: 'SKU',
		enableSorting: false,
		cell: ({ row }) => <span className='font-medium'>{row.original.sku}</span>,
	},
	{
		accessorKey: 'productionDate',
		header: 'Date',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>
				{format(new Date(row.original.productionDate), 'MMM d, yyyy')}
			</span>
		),
	},
	{
		accessorKey: 'lotNumber',
		header: 'Lot Number',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-muted-foreground'>{row.original.lotNumber}</span>
		),
	},
	{
		accessorKey: 'quantity',
		header: 'Quantity',
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.quantity.toLocaleString()}</span>,
	},
	{
		id: 'actions',
		header: '',
		enableSorting: false,
		cell: ({ row }) => (
			<div className='flex justify-end'>
				<ProductionRunActions run={row.original} />
			</div>
		),
	},
];
