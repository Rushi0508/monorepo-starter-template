'use client';

import { tooltips } from '@repo/constants';
import type {
	InventoryBreakdownRow,
	InventoryGroupBy,
	InventorySummaryFilterType,
	InventorySummaryTotals,
} from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@repo/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import CustomTooltip from '@/components/general/CustomTooltip';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useInventorySummary } from '@/queries';
import AlertMessage from '../general/AlertMessage';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '../general/SegmentedToggle';

const BREAKDOWN_OPTIONS: SegmentedToggleOption<InventoryGroupBy>[] = [
	{ value: 'sku', label: 'SKU', title: 'Break down by SKU' },
	{ value: 'location', label: 'Location', title: 'Break down by location' },
];

const DEFAULT_FILTERS: InventorySummaryFilterType = {
	breakdownBy: 'sku',
};

const plural = (count: number, noun: string) =>
	`${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;

const rowDetail = (
	row: InventoryBreakdownRow,
	breakdownBy: InventoryGroupBy,
	depth: number
): string | null => {
	if (depth === 0 && breakdownBy === 'location') {
		return plural(row.children?.length ?? 0, 'SKU');
	}
	return row.label !== row.key ? row.key : null;
};

const buildColumns = (
	breakdownBy: InventoryGroupBy,
	totals: InventorySummaryTotals
): CustomColumnDef<InventoryBreakdownRow>[] => [
	{
		id: 'label',
		header: breakdownBy === 'sku' ? 'SKU' : 'Location',
		cell: ({ row }) => {
			const detail = rowDetail(row.original, breakdownBy, row.depth);

			if (row.depth > 0) {
				return (
					<div className='flex min-h-7 flex-col justify-center pl-7 text-muted-foreground'>
						<p>{row.original.label}</p>
						{detail && <p className='text-xs opacity-80'>{detail}</p>}
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
					<div>
						<p className='font-medium'>{row.original.label}</p>
						{detail && (
							<p className='text-xs text-muted-foreground'>{detail}</p>
						)}
					</div>
				</div>
			);
		},
		footer: () => <span className='pl-5'>Total</span>,
		enableSorting: false,
	},
	{
		id: 'onHand',
		header: 'On Hand',
		accessorKey: 'onHand',
		cell: ({ row }) => row.original.onHand.toLocaleString(),
		footer: () => totals.onHand.toLocaleString(),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'available',
		header: 'Available',
		accessorKey: 'available',
		cell: ({ row }) => row.original.available.toLocaleString(),
		footer: () => totals.available.toLocaleString(),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'committed',
		header: 'Committed',
		accessorKey: 'committed',
		cell: ({ row }) => row.original.committed.toLocaleString(),
		footer: () => totals.committed.toLocaleString(),
		cellClassName: 'tabular-nums',
	},
	{
		id: 'value',
		header: () => (
			<span className='flex items-center gap-1'>
				Inventory Value
				<CustomTooltip content={tooltips.inventoryPage.inventoryValue} />
			</span>
		),
		accessorKey: 'value',
		cell: ({ row }) =>
			row.original.value != null ? formatCurrency(row.original.value) : '—',
		footer: () => formatCurrency(totals.value),
		cellClassName: 'tabular-nums font-medium',
	},
	{
		id: 'valueShare',
		header: '% of Value',
		accessorKey: 'valueShare',
		cell: ({ row }) =>
			row.original.valueShare != null ? `${row.original.valueShare}%` : '—',
		footer: () => (totals.value > 0 ? '100%' : '—'),
		cellClassName: 'tabular-nums',
	},
];

interface InventoryBreakdownTableProps {
	rows: InventoryBreakdownRow[];
	totals: InventorySummaryTotals;
	/** How `rows` are grouped */
	breakdownBy: InventoryGroupBy;
	/** What the toggle shows — ahead of `breakdownBy` while the new grouping loads */
	selectedBreakdownBy: InventoryGroupBy;
	onBreakdownByChange: (breakdownBy: InventoryGroupBy) => void;
}

/**
 * Stock across every warehouse partner, valued at current COGS, broken down by
 * SKU or by location with each row expandable into the other dimension.
 */
export function InventoryBreakdownTable({
	rows,
	totals,
	breakdownBy,
	selectedBreakdownBy,
	onBreakdownByChange,
}: InventoryBreakdownTableProps) {
	const isSku = breakdownBy === 'sku';

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<h2 className='text-sm font-semibold'>
					Inventory by {isSku ? 'SKU' : 'location'}{' '}
					<span className='font-normal text-muted-foreground'>
						· {plural(rows.length, isSku ? 'SKU' : 'location')}
					</span>
				</h2>
				<SegmentedToggle
					value={selectedBreakdownBy}
					onChange={onBreakdownByChange}
					options={BREAKDOWN_OPTIONS}
					ariaLabel='Break down by'
					className='w-40'
				/>
			</div>

			{/* Remounting per grouping closes rows opened in the other one */}
			<CustomTable
				key={breakdownBy}
				data={rows}
				columns={buildColumns(breakdownBy, totals)}
				getSubRows={(row) => row.children}
				enableSorting
				className='rounded-none! border-0!'
				// Child rows: compact and muted, overriding the cells' own classes
				getRowClassName={(_row, depth) =>
					depth > 0
						? 'bg-muted/30 hover:bg-muted/30 [&>td]:py-1.5 [&>td]:font-normal [&>td]:text-muted-foreground'
						: ''
				}
			/>
		</div>
	);
}

export function InventorySummarySection() {
	const { filters, setFilters } = useQueryFilters(DEFAULT_FILTERS);
	const { data, isLoading, isPlaceholderData, error } =
		useInventorySummary(filters);

	if (error) {
		return <AlertMessage message={error.message} variant='destructive' />;
	}
	if (isLoading || !data) {
		return <div className='h-64 animate-pulse rounded-xl border bg-muted' />;
	}
	return (
		<div
			className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}
		>
			<InventoryBreakdownTable
				rows={data.breakdown}
				totals={data.totals}
				breakdownBy={data.breakdownBy}
				selectedBreakdownBy={filters.breakdownBy ?? 'sku'}
				onBreakdownByChange={(breakdownBy) => setFilters({ breakdownBy })}
			/>
		</div>
	);
}
