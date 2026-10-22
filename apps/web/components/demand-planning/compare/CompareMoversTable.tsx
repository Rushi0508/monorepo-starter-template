'use client';

import { tooltips } from '@repo/constants';
import type { SkuOptionType } from '@repo/types';
import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import CustomTooltip from '@/components/general/CustomTooltip';
import EmptyMessage from '@/components/general/EmptyMessage';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '@/components/general/SegmentedToggle';
import { useSkuOptions } from '@/queries';
import {
	formatMoney,
	formatNumber,
	formatSignedNumber,
	formatSignedPercent,
	missToneClass,
} from '../shared/format';
import { periodLabelLong, periodLabelShort } from '../shared/period';
import {
	type ComparisonTotals,
	type MoverRow,
	type MoversBy,
	type PeriodRange,
	revenueDelta,
	totalsOfMovers,
	unitsDelta,
} from './data';

const MOVERS_OPTIONS: SegmentedToggleOption<MoversBy>[] = [
	{ value: 'sku', label: 'SKU', title: 'Group movers by SKU' },
	{ value: 'channel', label: 'Channel', title: 'Group movers by channel' },
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
	moversBy: MoversBy,
	totals: ComparisonTotals
): CustomColumnDef<MoverRow>[] => [
	{
		id: 'label',
		footer: () => 'Total',
		header: moversBy === 'sku' ? 'SKU' : 'Channel',
		cell: ({ row }) => {
			if (row.depth > 0) {
				return (
					<div className='pl-7 text-muted-foreground'>
						{moversBy === 'sku' ? (
							row.original.channel
						) : (
							<SkuLabel sku={skuById.get(row.original.skuSettingId)} muted />
						)}
					</div>
				);
			}

			const Chevron = row.getIsExpanded() ? ChevronDown : ChevronRight;
			return (
				<div className='flex items-center gap-1.5'>
					<Chevron
						className={cn(
							'size-3.5 shrink-0 text-muted-foreground',
							!row.getCanExpand() && 'invisible'
						)}
					/>
					{moversBy === 'sku' ? (
						<SkuLabel sku={skuById.get(row.original.skuSettingId)} />
					) : (
						<span className='font-medium'>{row.original.channel}</span>
					)}
					{row.original.isScopeChange && (
						<Badge variant='outline' className='ml-1 whitespace-nowrap'>
							{row.original.unitsA === 0 ? 'Added' : 'Dropped'}
						</Badge>
					)}
				</div>
			);
		},
		enableSorting: false,
	},
	{
		id: 'units',
		header: 'Cases',
		accessorKey: 'unitsB',
		footer: () => (
			<div className='flex flex-col gap-0.5'>
				<span>{formatNumber(totals.unitsB)}</span>
				<span className='text-xs font-normal text-muted-foreground'>
					was {formatNumber(totals.unitsA)}
				</span>
			</div>
		),
		cell: ({ row }) => (
			<div className='flex flex-col gap-0.5'>
				<span>{formatNumber(row.original.unitsB)}</span>
				<span className='text-xs text-muted-foreground'>
					was {formatNumber(row.original.unitsA)}
				</span>
			</div>
		),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'unitsDelta',
		header: 'Change',
		accessorFn: (row) => unitsDelta(row),
		footer: () => (
			<div className='flex flex-col gap-0.5'>
				<span className={cn('font-medium', missToneClass(unitsDelta(totals)))}>
					{formatSignedNumber(unitsDelta(totals))}
				</span>
				<span className='text-xs font-normal text-muted-foreground'>
					{totals.changePct === null
						? '—'
						: formatSignedPercent(totals.changePct)}
				</span>
			</div>
		),
		cell: ({ row }) => {
			const delta = unitsDelta(row.original);
			return (
				<div className='flex flex-col gap-0.5'>
					<span className={cn('font-medium', missToneClass(delta))}>
						{formatSignedNumber(delta)}
					</span>
					<span className='text-xs text-muted-foreground'>
						{row.original.changePct === null
							? '—'
							: formatSignedPercent(row.original.changePct)}
					</span>
				</div>
			);
		},
		cellClassName: 'tabular-nums',
	},
	{
		id: 'volumeEffect',
		header: 'Volume effect',
		accessorKey: 'volumeEffect',
		footer: () => (
			<span className={missToneClass(totals.volumeEffect)}>
				{formatMoney(totals.volumeEffect)}
			</span>
		),
		cell: ({ row }) =>
			row.original.isScopeChange ? (
				<span className='text-muted-foreground'>—</span>
			) : (
				<span className={missToneClass(row.original.volumeEffect)}>
					{formatMoney(row.original.volumeEffect)}
				</span>
			),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'priceEffect',
		header: 'Price effect',
		accessorKey: 'priceEffect',
		footer: () => (
			<span className={missToneClass(totals.priceEffect)}>
				{formatMoney(totals.priceEffect)}
			</span>
		),
		cell: ({ row }) =>
			row.original.isScopeChange ? (
				<span className='text-muted-foreground'>—</span>
			) : (
				<span className={missToneClass(row.original.priceEffect)}>
					{formatMoney(row.original.priceEffect)}
				</span>
			),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'revenueDelta',
		header: 'Revenue',
		accessorFn: (row) => revenueDelta(row),
		footer: () => (
			<span className={cn('font-medium', missToneClass(revenueDelta(totals)))}>
				{formatMoney(revenueDelta(totals))}
			</span>
		),
		cell: ({ row }) => {
			const delta = revenueDelta(row.original);
			return (
				<span className={cn('font-medium', missToneClass(delta))}>
					{formatMoney(delta)}
				</span>
			);
		},
		cellClassName: 'tabular-nums',
	},
];

interface CompareMoversTableProps {
	movers: MoverRow[];
	range?: PeriodRange;
	moversBy: MoversBy;
	onMoversByChange: (moversBy: MoversBy) => void;
}

export function CompareMoversTable({
	movers,
	range,
	moversBy,
	onMoversByChange,
}: CompareMoversTableProps) {
	const { data: skuOptions = [] } = useSkuOptions();
	const skuById = new Map(skuOptions.map((sku) => [sku.id, sku]));
	const totals = totalsOfMovers(movers);

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<h2 className='flex items-center gap-1.5 text-sm font-semibold'>
					Largest movers
					{range && (
						<span className='font-normal text-muted-foreground'>
							·{' '}
							{range.from === range.to
								? periodLabelLong(range.from)
								: `${periodLabelShort(range.from)} – ${periodLabelShort(range.to)}`}
						</span>
					)}
					<CustomTooltip content={tooltips.demandPlanningPage.movers} />
				</h2>

				<SegmentedToggle
					value={moversBy}
					onChange={onMoversByChange}
					options={MOVERS_OPTIONS}
					ariaLabel='Group movers by'
					className='w-32'
				/>
			</div>

			{/* Remounting per grouping closes rows opened in the other one */}
			<CustomTable
				key={moversBy}
				data={movers}
				columns={buildColumns(skuById, moversBy, totals)}
				getSubRows={(row) => row.children}
				enableSorting
				className='rounded-none! border-0!'
				headerClassName='text-primary font-semibold text-xs'
				cellClassName='text-primary text-xs'
				getRowClassName={(_row, depth) =>
					depth > 0
						? 'bg-muted/30 hover:bg-muted/30 [&>td]:py-1.5 [&>td]:font-normal [&>td]:text-muted-foreground'
						: ''
				}
				emptyState={
					<EmptyMessage
						message='Nothing moved this month'
						description='Both plans forecast the same cases at the same prices here.'
					/>
				}
			/>
		</div>
	);
}
