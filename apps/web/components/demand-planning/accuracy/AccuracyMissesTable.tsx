'use client';

import type { DemandAccuracyMissType, SkuOptionType } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '@/components/general/SegmentedToggle';
import { useSkuOptions } from '@/queries';
import {
	accuracyToneClass,
	formatNumber,
	formatPercent,
	formatSignedNumber,
	formatSignedPercent,
	missToneClass,
} from '../shared/format';
import { periodLabelLong } from '../shared/period';
import {
	type MissesBy,
	type MissRow,
	type MissTotals,
	rollUpMisses,
	totalsOfMisses,
} from './data';

const GROUP_OPTIONS: SegmentedToggleOption<MissesBy>[] = [
	{ value: 'sku', label: 'SKU', title: 'Group misses by SKU' },
	{ value: 'channel', label: 'Channel', title: 'Group misses by channel' },
];

function SkuLabel({ sku, muted }: { sku?: SkuOptionType; muted?: boolean }) {
	if (!sku) return <span className='text-muted-foreground'>Unknown SKU</span>;

	return (
		<div className='flex flex-col gap-0.5'>
			<span className={muted ? undefined : 'font-medium'}>{sku.title}</span>
			{sku.title !== sku.sku && (
				<span className='text-xs text-muted-foreground'>{sku.sku}</span>
			)}
		</div>
	);
}

const buildColumns = (
	skuById: Map<string, SkuOptionType>,
	groupBy: MissesBy,
	totals: MissTotals
): CustomColumnDef<MissRow>[] => [
	{
		id: 'label',
		header: groupBy === 'channel' ? 'Channel' : 'SKU',
		accessorKey: 'groupKey',
		footer: () => 'Total',
		cell: ({ row }) => {
			if (row.depth > 0) {
				return (
					<div className='flex min-h-9 flex-col justify-center pl-7 text-muted-foreground'>
						{groupBy === 'channel' ? (
							<SkuLabel sku={skuById.get(row.original.skuSettingId)} muted />
						) : (
							row.original.channel
						)}
					</div>
				);
			}

			const Chevron = row.getIsExpanded() ? ChevronDown : ChevronRight;
			return (
				<div className='flex min-h-9 items-center gap-1.5'>
					<Chevron
						className={cn(
							'size-3.5 shrink-0 text-muted-foreground',
							!row.getCanExpand() && 'invisible'
						)}
					/>
					{groupBy === 'channel' ? (
						<span className='font-medium'>{row.original.channel}</span>
					) : (
						<SkuLabel sku={skuById.get(row.original.skuSettingId)} />
					)}
				</div>
			);
		},
		enableSorting: false,
	},
	{
		id: 'forecast',
		header: 'Forecast',
		accessorKey: 'forecast',
		footer: () => formatNumber(totals.forecast),
		cell: ({ row }) => formatNumber(row.original.forecast),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'actual',
		header: 'Actual',
		accessorKey: 'actual',
		footer: () => formatNumber(totals.actual),
		cell: ({ row }) => formatNumber(row.original.actual),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'variance',
		header: 'Miss',
		accessorKey: 'variance',
		footer: () => (
			<span className={missToneClass(totals.variance)}>
				{formatSignedNumber(totals.variance)}
			</span>
		),
		cell: ({ row }) => (
			<span className={cn('font-medium', missToneClass(row.original.variance))}>
				{formatSignedNumber(row.original.variance)}
			</span>
		),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'missPct',
		header: 'Miss %',
		accessorFn: (row) => (row.forecast === 0 ? 0 : row.variance / row.forecast),
		footer: () => (
			<span className={missToneClass(totals.variance)}>
				{totals.forecast === 0
					? '—'
					: formatSignedPercent(totals.variance / totals.forecast)}
			</span>
		),
		cell: ({ row }) => (
			<span className={cn('font-medium', missToneClass(row.original.variance))}>
				{row.original.forecast === 0
					? '—'
					: formatSignedPercent(row.original.variance / row.original.forecast)}
			</span>
		),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'accuracyPct',
		header: 'Accuracy',
		accessorKey: 'accuracyPct',
		footer: () => (
			<span className={accuracyToneClass(totals.accuracyPct)}>
				{formatPercent(totals.accuracyPct)}
			</span>
		),
		cell: ({ row }) => (
			<span className={accuracyToneClass(row.original.accuracyPct)}>
				{formatPercent(row.original.accuracyPct)}
			</span>
		),
		cellClassName: 'tabular-nums',
	},
];

interface AccuracyMissesTableProps {
	misses: DemandAccuracyMissType[];
	demandPeriod: string;
}

export function AccuracyMissesTable({
	misses,
	demandPeriod,
}: AccuracyMissesTableProps) {
	const [groupBy, setGroupBy] = useState<MissesBy>('sku');
	const { data: skuOptions = [] } = useSkuOptions();
	const skuById = new Map(skuOptions.map((option) => [option.id, option]));

	const rows = rollUpMisses(misses, groupBy);
	const totals = totalsOfMisses(rows);

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<div>
					<h2 className='text-sm font-semibold'>
						Where we got it wrong{' '}
						<span className='font-normal text-muted-foreground'>
							· {periodLabelLong(demandPeriod)}
						</span>
					</h2>
					<p className='mt-0.5 text-xs text-muted-foreground'>
						Biggest absolute miss first; a positive miss means demand was
						underestimated. Click a row to break it down by{' '}
						{groupBy === 'channel' ? 'SKU' : 'channel'}.
					</p>
				</div>

				<SegmentedToggle
					value={groupBy}
					onChange={setGroupBy}
					options={GROUP_OPTIONS}
					ariaLabel='Group misses by'
					className='w-32'
				/>
			</div>

			{/* Remounting per grouping closes rows opened in the other one */}
			<CustomTable
				key={groupBy}
				data={rows}
				columns={buildColumns(skuById, groupBy, totals)}
				getSubRows={(row) => row.children}
				enableSorting
				className='rounded-none! border-0!'
				headerClassName='text-primary font-semibold text-xs'
				cellClassName='text-primary text-xs'
				getRowClassName={(_row, depth) =>
					depth > 0
						? 'bg-muted/30 hover:bg-muted/30 [&>td]:font-normal [&>td]:text-muted-foreground'
						: ''
				}
				emptyState={
					<EmptyMessage
						message='Nothing to score'
						description='No lines to score under these filters.'
					/>
				}
			/>
		</div>
	);
}
