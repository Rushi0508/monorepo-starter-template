'use client';

import type { GetDemandAccuracyResponseType } from '@repo/types';
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

type ChannelRow = {
	label: string;
	forecast: number;
	actual: number;
	accuracyPct: number;
	isRollup: boolean;
};

const channelCols: CustomColumnDef<ChannelRow>[] = [
	{
		id: 'label',
		header: 'Channel',
		accessorKey: 'label',
		cell: ({ row }) => (
			<span className={cn(row.original.isRollup && 'font-semibold')}>
				{row.original.label}
			</span>
		),
		enableSorting: false,
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

interface AccuracyByChannelTableProps {
	rows: GetDemandAccuracyResponseType['byChannel'];
	rollup: GetDemandAccuracyResponseType['summary'];
}

export function AccuracyByChannelTable({
	rows,
	rollup,
}: AccuracyByChannelTableProps) {
	const data: ChannelRow[] = [
		...rows.map((row) => ({
			label: row.channel,
			forecast: row.forecast,
			actual: row.actual,
			accuracyPct: row.accuracyPct,
			isRollup: false,
		})),
		...(rollup
			? [
					{
						label: 'Company roll-up',
						forecast: rollup.forecast,
						actual: rollup.actual,
						accuracyPct: rollup.accuracyPct,
						isRollup: true,
					},
				]
			: []),
	];

	return (
		<Card className='shadow-xs gap-0 p-3'>
			<CardHeader className='p-2'>
				<CardTitle>Accuracy by channel</CardTitle>
				<CardDescription className='text-xs'>
					A strong company number can hide two channels missing in opposite
					directions, since their errors cancel in the roll-up.
				</CardDescription>
			</CardHeader>
			<CardContent className='p-2'>
				<CustomTable
					data={data}
					columns={channelCols}
					enableSorting
					getRowClassName={(row) => (row.isRollup ? 'bg-muted/50' : '')}
					cellClassName='text-xs'
					headerClassName='text-xs'
					emptyState={
						<EmptyMessage
							message='No channels to score'
							description='No finalized plan covers this month under the current filters.'
						/>
					}
				/>
			</CardContent>
		</Card>
	);
}
