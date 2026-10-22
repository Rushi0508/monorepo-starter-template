'use client';

import { ChannelEnum } from '@repo/enums';
import type { FulfillmentOrderItem } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@repo/utils/string.utils';
import type { SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { CHANNEL_STYLES } from '../badge-style-config';
import { EnumBadge } from '../general/CustomBadge';
import type { CustomColumnDef } from '../general/CustomTable';
import { CustomTable } from '../general/CustomTable';
import EmptyMessage from '../general/EmptyMessage';
import { OrderDetailSheet } from '../orders/OrderDetailSheet';

const DateCell = ({ value }: { value: string | null }) => {
	if (!value) return <span className='text-muted-foreground text-sm'>—</span>;
	const d = new Date(value);
	return (
		<div className='tabular-nums'>
			<p className='text-sm'>{format(d, 'MMM d, yy')}</p>
			<p className='text-xs text-muted-foreground'>{format(d, 'h:mm a')}</p>
		</div>
	);
};

const DeliveryCell = ({
	delivered,
	estimated,
}: {
	delivered: string | null;
	estimated: string | null;
}) => {
	if (delivered) {
		const d = new Date(delivered);
		return (
			<div className='tabular-nums'>
				<p className='text-sm font-medium text-emerald-600'>
					{format(d, 'MMM d, yy')}
				</p>
				<p className='text-xs text-emerald-600/70'>{format(d, 'h:mm a')}</p>
			</div>
		);
	}
	if (estimated) {
		const d = new Date(estimated);
		return (
			<div className='tabular-nums'>
				<p className='text-sm text-muted-foreground italic'>
					{format(d, 'MMM d, yy')}
				</p>
				<p className='text-xs text-muted-foreground/70'>Est. delivery</p>
			</div>
		);
	}
	return <span className='text-muted-foreground text-sm'>—</span>;
};

const fulfillmentTableCols: CustomColumnDef<FulfillmentOrderItem>[] = [
	{
		id: 'orderName',
		header: 'Order #',
		accessorKey: 'orderName',
		enableSorting: false,
		cell: ({ row }) => {
			const cancelled = Boolean(row.original.cancelledAt);
			return (
				<>
					<span
						className={cn(
							'text-sm font-semibold flex flex-col',
							cancelled && 'line-through text-muted-foreground'
						)}
					>
						{row.original.orderName
							? `${row.original.orderName}`
							: row.original.orderNumber
								? `#${row.original.orderNumber}`
								: `BB-${row.original.blueboxId ?? '—'}`}
					</span>
					{cancelled && (
						<span className='text-xs font-normal text-destructive'>
							Cancelled on{' '}
							{format(new Date(row.original.cancelledAt ?? ''), 'MMM d, yy')}
						</span>
					)}
				</>
			);
		},
	},
	{
		id: 'customer',
		header: 'Customer',
		accessorKey: 'customerDisplayName',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-sm flex flex-col'>
				{row.original.customerDisplayName ?? '—'}
				<span className='text-xs text-muted-foreground'>
					{row.original.customerEmail || 'No email'}
				</span>
			</span>
		),
	},
	{
		id: 'totalPrice',
		header: 'Amount',
		accessorKey: 'totalPrice',
		enableSorting: true,
		sortDescFirst: false,
		cell: ({ row }) => (
			<span className='text-sm font-medium tabular-nums'>
				{row.original.totalPrice != null
					? formatCurrency(row.original.totalPrice)
					: '—'}
			</span>
		),
	},
	{
		id: 'channel',
		header: 'Channel',
		accessorKey: 'channel',
		enableSorting: false,
		cell: ({ row }) =>
			row.original.channel ? (
				<EnumBadge
					value={row.original.channel as ChannelEnum}
					className={cn(CHANNEL_STYLES[row.original.channel as ChannelEnum])}
					allCaps
				/>
			) : (
				<span className='text-muted-foreground text-sm'>—</span>
			),
	},
	{
		id: 'date',
		header: 'Ordered',
		accessorKey: 'date',
		enableSorting: true,
		sortDescFirst: false,
		cell: ({ row }) => <DateCell value={row.original.date} />,
	},
	{
		id: 'dateOrderPicked',
		header: 'Picked',
		accessorKey: 'dateOrderPicked',
		enableSorting: true,
		sortDescFirst: false,
		cell: ({ row }) => <DateCell value={row.original.dateOrderPicked} />,
	},
	{
		id: 'dateOrderShipped',
		header: 'Shipped',
		accessorKey: 'dateOrderShipped',
		enableSorting: true,
		sortDescFirst: false,
		cell: ({ row }) => <DateCell value={row.original.dateOrderShipped} />,
	},
	{
		id: 'dateOrderDelivered',
		header: 'Delivery',
		accessorKey: 'dateOrderDelivered',
		enableSorting: true,
		sortDescFirst: false,
		cell: ({ row }) => (
			<DeliveryCell
				delivered={row.original.dateOrderDelivered}
				estimated={row.original.estimatedDeliveryAt}
			/>
		),
	},
];

interface FulfillmentTableProps {
	data: FulfillmentOrderItem[];
	totalCount: number;
	page: number;
	limit: number;
	onPaginationChange: (page: number, limit: number) => void;
	onSortingChange: (sorting: SortingState) => void;
	sortingState: SortingState;
}

export const FulfillmentTable = ({
	data,
	totalCount,
	page,
	limit,
	onPaginationChange,
	onSortingChange,
	sortingState,
}: FulfillmentTableProps) => {
	const [selectedOrder, setSelectedOrder] =
		useState<FulfillmentOrderItem | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	return (
		<>
			<CustomTable<FulfillmentOrderItem>
				data={data}
				columns={fulfillmentTableCols}
				enableSorting
				sortingMode='server'
				sortingState={sortingState}
				onSortingChange={onSortingChange}
				enablePagination
				paginationMode='server'
				pageSize={limit}
				currentPage={page}
				totalCount={totalCount}
				onPaginationChange={onPaginationChange}
				onRowClick={(row) => {
					setSelectedOrder(row);
					setSheetOpen(true);
				}}
				emptyState={
					<EmptyMessage
						message='No orders found'
						description='No fulfillment orders match the current filters.'
						icon={<Package className='size-8 text-muted-foreground' />}
					/>
				}
			/>
			<OrderDetailSheet
				order={selectedOrder}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
};
