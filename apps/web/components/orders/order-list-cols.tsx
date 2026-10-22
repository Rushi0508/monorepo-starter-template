'use client';

import {
	BlueboxWorkflowStatusEnum,
	ChannelEnum,
	FulfillmentStatusEnum,
	PaymentStatusEnum,
} from '@repo/enums';
import { OrderItem } from '@repo/types/dist';
import { cn } from '@repo/ui/lib/utils';
import { isBlueboxEligibleChannel } from '@repo/utils';
import { formatCurrency } from '@repo/utils/string.utils';
import { format } from 'date-fns';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import {
	BLUEBOX_WORKFLOW_STATUS_STYLES,
	CHANNEL_STYLES,
	FULFILLMENT_STYLES,
	PAYMENT_STYLES,
} from '../badge-style-config';
import { EnumBadge } from '../general/CustomBadge';
import { OverflowList } from '../OverflowList';

// ─── column definitions ────────────────────────────────────────────────────────

export const orderListCols: CustomColumnDef<OrderItem>[] = [
	{
		accessorKey: 'orderName',
		header: 'Order #',
		enableSorting: false,
		cell: ({ row }) => {
			const cancelled = Boolean(row.original.cancelledAt);
			return (
				<span
					className={cn(
						'font-medium tabular-nums',
						cancelled && 'line-through text-muted-foreground'
					)}
				>
					{row.original.orderName
						? `${row.original.orderName}`
						: `#${row.original.orderNumber}`}
				</span>
			);
		},
	},
	{
		accessorKey: 'date',
		header: 'Date',
		enableSorting: true,
		cell: ({ row }) => {
			const cancelled = Boolean(row.original.cancelledAt);
			return (
				<div className='text-sm whitespace-nowrap'>
					<p
						className={cn('text-muted-foreground', cancelled && 'line-through')}
					>
						{row.original.date
							? format(new Date(row.original.date), 'MMM d, yyyy')
							: '—'}
					</p>
					{cancelled && row.original.cancelledAt && (
						<p className='text-xs text-red-500 mt-0.5'>
							Cancelled{' '}
							{format(new Date(row.original.cancelledAt), 'MMM d, yyyy')}
						</p>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'channel',
		header: 'Channel',
		enableSorting: false,
		cell: ({ row }) => (
			<EnumBadge
				value={row.original.channel as ChannelEnum}
				className={cn(CHANNEL_STYLES[row.original.channel as ChannelEnum])}
				allCaps
			/>
		),
	},
	{
		accessorKey: 'customerDisplayName',
		header: 'Customer',
		enableSorting: false,
		cell: ({ row }) => (
			<div className='min-w-0'>
				<p className='font-medium truncate'>
					{row.original.customerDisplayName ?? '—'}
				</p>
				<p className='text-xs text-muted-foreground truncate'>
					{row.original.customerEmail || 'No email'}
				</p>
			</div>
		),
	},
	{
		accessorKey: 'skus',
		header: 'SKUs',
		enableSorting: false,
		cell: ({ row }) => {
			return <OverflowList items={row.original.skus} visibleCount={1} />;
		},
	},
	{
		accessorKey: 'netRevenue',
		header: 'Net Revenue',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='font-medium tabular-nums'>
				{row.original.netRevenue != null
					? formatCurrency(row.original.netRevenue)
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'paymentStatus',
		header: 'Payment',
		enableSorting: false,
		cell: ({ row }) => (
			<EnumBadge
				allCaps
				value={row.original.paymentStatus as PaymentStatusEnum}
				className={cn(
					PAYMENT_STYLES[row.original.paymentStatus as PaymentStatusEnum]
				)}
			/>
		),
	},
	{
		accessorKey: 'fulfillmentStatus',
		header: 'Fulfillment',
		enableSorting: false,
		cell: ({ row }) => (
			<EnumBadge
				allCaps
				value={row.original.fulfillmentStatus as FulfillmentStatusEnum}
				className={cn(
					FULFILLMENT_STYLES[
						row.original.fulfillmentStatus as FulfillmentStatusEnum
					]
				)}
			/>
		),
	},
	{
		accessorKey: 'blueboxWorkflowStatus',
		header: 'BlueBox',
		enableSorting: false,
		cell: ({ row }) => {
			const status = row.original.blueboxWorkflowStatus;
			if (!isBlueboxEligibleChannel(row.original.channel as ChannelEnum)) {
				return <span className='text-muted-foreground'>N/A</span>;
			}
			if (!status) {
				return <span className='text-muted-foreground'>—</span>;
			}
			return (
				<EnumBadge
					allCaps
					value={status as BlueboxWorkflowStatusEnum}
					className={cn(
						BLUEBOX_WORKFLOW_STATUS_STYLES[status as BlueboxWorkflowStatusEnum]
					)}
				/>
			);
		},
	},
];
