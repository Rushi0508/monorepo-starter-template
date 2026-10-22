'use client';

import { tooltips } from '@repo/constants';
import type { SkuVelocityItem } from '@repo/types';
import { useMemo } from 'react';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import { CustomTable } from '@/components/general/CustomTable';
import CustomTooltip from '@/components/general/CustomTooltip';

const cust = tooltips.customerPage;

const formatRate = (value: number | null) =>
	value ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-';

type RateKey = 'unitsPerWeek' | 'unitsPerStorePerWeek' | 'cansPerStorePerWeek';

const sumRates = (rows: SkuVelocityItem[], key: RateKey) =>
	Math.round(rows.reduce((sum, row) => sum + (row[key] ?? 0), 0) * 100) / 100;

const headerWithTooltip = (label: string, tooltip: string) => () => (
	<span className='flex items-center gap-1'>
		{label}
		<CustomTooltip content={tooltip} />
	</span>
);

const getSkuVelocityCols = (
	rows: SkuVelocityItem[]
): CustomColumnDef<SkuVelocityItem>[] => [
	{
		id: 'sku',
		header: 'SKU',
		accessorKey: 'sku',
		cell: ({ row }) => (
			<div>
				<p className='text-sm font-medium'>{row.original.title}</p>
				{row.original.sku && (
					<p className='text-xs text-muted-foreground truncate max-w-48'>
						{row.original.sku}
					</p>
				)}
			</div>
		),
		footer: () => 'Total',
		enableSorting: false,
	},
	{
		id: 'totalUnits',
		header: 'Total Units',
		accessorKey: 'totalUnits',
		cell: ({ row }) => row.original.totalUnits.toLocaleString(),
		footer: () =>
			rows.reduce((sum, row) => sum + row.totalUnits, 0).toLocaleString(),
		cellClassName: 'tabular-nums font-medium',
		enableSorting: true,
	},
	{
		id: 'unitsPerWeek',
		header: headerWithTooltip('Units / Week', cust.unitsPerWeek),
		accessorKey: 'unitsPerWeek',
		cell: ({ row }) => formatRate(row.original.unitsPerWeek),
		footer: () => formatRate(sumRates(rows, 'unitsPerWeek')),
		cellClassName: 'tabular-nums font-medium',
		enableSorting: true,
	},
	{
		id: 'unitsPerStorePerWeek',
		header: headerWithTooltip(
			'Units / Store / Week',
			cust.unitsPerStorePerWeek
		),
		accessorKey: 'unitsPerStorePerWeek',
		cell: ({ row }) => formatRate(row.original.unitsPerStorePerWeek),
		footer: () => formatRate(sumRates(rows, 'unitsPerStorePerWeek')),
		cellClassName: 'tabular-nums font-medium',
		enableSorting: true,
	},
	{
		id: 'cansPerStorePerWeek',
		header: headerWithTooltip('Cans / Store / Week', cust.cansPerStorePerWeek),
		accessorKey: 'cansPerStorePerWeek',
		cell: ({ row }) => formatRate(row.original.cansPerStorePerWeek),
		footer: () => formatRate(sumRates(rows, 'cansPerStorePerWeek')),
		cellClassName: 'tabular-nums font-medium',
		enableSorting: true,
	},
];

interface SkuVelocityCardProps {
	data: SkuVelocityItem[];
}

const SkuVelocityCard = ({ data }: SkuVelocityCardProps) => {
	const columns = useMemo(() => getSkuVelocityCols(data), [data]);

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='border-b px-5 py-4 flex items-center gap-2'>
				<h2 className='text-sm font-semibold'>
					SKU Velocity{' '}
					<span className='text-muted-foreground font-normal'>
						· {data.length} SKUs
					</span>
				</h2>
				<CustomTooltip content={cust.skuVelocity} />
			</div>
			<CustomTable<SkuVelocityItem>
				data={data}
				columns={columns}
				enableSorting
				sortingMode='client'
				className='rounded-none! border-0!'
			/>
		</div>
	);
};

export default SkuVelocityCard;
