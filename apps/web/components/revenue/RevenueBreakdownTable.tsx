'use client';

import type { RevenueBreakdownRow, RevenueGroupBy } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@repo/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '../general/SegmentedToggle';

const BREAKDOWN_OPTIONS: SegmentedToggleOption<RevenueGroupBy>[] = [
	{ value: 'channel', label: 'Channel', title: 'Break down by channel' },
	{ value: 'sku', label: 'SKU', title: 'Break down by SKU' },
];

const plural = (count: number, noun: string) =>
	`${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`;

/**
 * The line under a row's name: order and SKU counts for a channel, or the SKU
 * code when the product title differs from it.
 */
const rowDetail = (row: RevenueBreakdownRow): string | null => {
	if (row.orders != null) {
		return `${plural(row.orders, 'order')} · ${plural(row.children?.length ?? 0, 'SKU')}`;
	}
	return row.label !== row.key ? row.key : null;
};

const buildColumns = (
	breakdownBy: RevenueGroupBy
): CustomColumnDef<RevenueBreakdownRow>[] => [
	{
		id: 'label',
		header: breakdownBy === 'channel' ? 'Channel' : 'SKU',
		cell: ({ row }) => {
			const detail = rowDetail(row.original);

			// Children are the other dimension, indented past the parent's chevron
			if (row.depth > 0) {
				return (
					<div className='pl-7 text-muted-foreground'>
						<p>{row.original.label}</p>
						{detail && <p className='text-xs opacity-80'>{detail}</p>}
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
					<div>
						<p className='font-medium'>{row.original.label}</p>
						{detail && (
							<p className='text-xs text-muted-foreground'>{detail}</p>
						)}
					</div>
				</div>
			);
		},
		enableSorting: false,
	},
	{
		id: 'cases',
		header: 'Cases',
		accessorKey: 'cases',
		cell: ({ row }) => row.original.cases.toLocaleString(),
	},
	{
		id: 'grossRevenue',
		header: 'Gross Revenue',
		accessorKey: 'grossRevenue',
		cell: ({ row }) => formatCurrency(row.original.grossRevenue),
		cellClassName: 'tabular-nums font-medium',
	},
	{
		id: 'netRevenue',
		header: 'Net Revenue',
		accessorKey: 'netRevenue',
		cell: ({ row }) => formatCurrency(row.original.netRevenue),
		cellClassName: 'tabular-nums font-medium',
	},
	{
		id: 'grossMarginPercentage',
		header: 'Gross Margin',
		accessorKey: 'grossMarginPercentage',
		cell: ({ row }) => `${row.original.grossMarginPercentage}%`,
	},
	{
		id: 'contributionMarginPercentage',
		header: 'Contribution Margin',
		accessorKey: 'contributionMarginPercentage',
		cell: ({ row }) => `${row.original.contributionMarginPercentage}%`,
	},
];

interface RevenueBreakdownTableProps {
	rows: RevenueBreakdownRow[];
	/** How `rows` are grouped */
	breakdownBy: RevenueGroupBy;
	/** What the toggle shows — ahead of `breakdownBy` while the new grouping loads */
	selectedBreakdownBy: RevenueGroupBy;
	onBreakdownByChange: (breakdownBy: RevenueGroupBy) => void;
}

/**
 * Revenue and margin grouped by channel or by SKU, with each row expandable into
 * the other dimension. The server sends only the grouping that was asked for.
 */
export function RevenueBreakdownTable({
	rows,
	breakdownBy,
	selectedBreakdownBy,
	onBreakdownByChange,
}: RevenueBreakdownTableProps) {
	const isChannel = breakdownBy === 'channel';

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<h2 className='text-sm font-semibold'>
					Breakdown by {isChannel ? 'channel' : 'SKU'}{' '}
					<span className='font-normal text-muted-foreground'>
						· {plural(rows.length, isChannel ? 'channel' : 'SKU')}
					</span>
				</h2>
				<SegmentedToggle
					value={selectedBreakdownBy}
					onChange={onBreakdownByChange}
					options={BREAKDOWN_OPTIONS}
					ariaLabel='Break down by'
					className='w-32'
				/>
			</div>

			{/* Remounting per grouping closes rows opened in the other one */}
			<CustomTable
				key={breakdownBy}
				data={rows}
				columns={buildColumns(breakdownBy)}
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

export function RevenueBreakdownTableSkeleton() {
	return <div className='h-64 animate-pulse rounded-xl border bg-muted' />;
}
