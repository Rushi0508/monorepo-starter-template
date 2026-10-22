'use client';

import type { DemandAccuracyType } from '@repo/types';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import {
	accuracyToneClass,
	formatNumber,
	formatPercent,
} from '../shared/format';

const buildColumns = (
	activeLag: number
): CustomColumnDef<DemandAccuracyType>[] => [
	{
		id: 'planName',
		header: 'Plan',
		accessorKey: 'planName',
		cell: ({ row }) => (
			<span
				className={cn(
					row.original.lag === activeLag && 'font-semibold text-primary'
				)}
			>
				{row.original.planName}
			</span>
		),
		enableSorting: false,
	},
	{
		id: 'lag',
		header: 'Lag',
		accessorKey: 'lag',
		cell: ({ row }) => `Lag ${row.original.lag}`,
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
	{
		id: 'forecast',
		header: 'Forecast',
		accessorKey: 'forecast',
		cell: ({ row }) => formatNumber(row.original.forecast),
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
	{
		id: 'actual',
		header: 'Actual',
		accessorKey: 'actual',
		cell: ({ row }) => formatNumber(row.original.actual),
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
	{
		id: 'accuracyPct',
		header: 'Accuracy',
		accessorKey: 'accuracyPct',
		cell: ({ row }) => (
			<span
				className={cn(
					'font-semibold',
					accuracyToneClass(row.original.accuracyPct)
				)}
			>
				{formatPercent(row.original.accuracyPct)}
			</span>
		),
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
];

interface AccuracyByLagTableProps {
	rows: DemandAccuracyType[];
	activeLag: number;
}

export function AccuracyByLagTable({
	rows,
	activeLag,
}: AccuracyByLagTableProps) {
	return (
		<Card className='shadow-xs gap-0 p-3'>
			<CardHeader className='p-2'>
				<CardTitle>Accuracy by lag</CardTitle>
				<CardDescription className='text-xs'>
					The same demand month scored against successively older plans.
					Forecasts made further ahead are expected to be worse — the gradient
					down the column is the signal, not any single row.
				</CardDescription>
			</CardHeader>
			<CardContent className='p-2'>
				<CustomTable
					data={rows}
					columns={buildColumns(activeLag)}
					enableSorting
					getRowClassName={(row) =>
						row.lag === activeLag ? 'bg-muted/50' : ''
					}
					cellClassName='text-xs'
					headerClassName='text-xs'
					emptyState={
						<EmptyMessage
							message='Nothing scored at this lag yet'
							description='No finalized plan covers this month at any of the offered lags.'
						/>
					}
				/>
			</CardContent>
		</Card>
	);
}
