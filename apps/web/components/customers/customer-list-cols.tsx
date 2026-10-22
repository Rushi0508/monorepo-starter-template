import { tooltips } from '@repo/constants';
import type { GetCustomersResponseType } from '@repo/types';
import { formatDistanceToNow } from 'date-fns';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import CustomTooltip from '@/components/general/CustomTooltip';

type CustomerRow = GetCustomersResponseType['data'][number];

const cust = tooltips.customerPage;

const baseColumns: CustomColumnDef<CustomerRow>[] = [
	{
		accessorKey: 'name',
		header: 'Customer',
		enableSorting: false,
		cell: ({ row }) => (
			<div>
				<p className='font-medium'>
					{row.original.name || row.original.displayName}
				</p>
				<p className='text-xs text-muted-foreground'>{row.original.email}</p>
			</div>
		),
	},
	{
		accessorKey: 'company',
		header: 'Company',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-sm'>{row.original.company || '-'}</span>
		),
	},
	{
		accessorKey: 'location',
		header: 'Location',
		enableSorting: false,
		cell: ({ row }) => (
			<span className='text-sm'>{row.original.location || '-'}</span>
		),
	},
	{
		id: 'orders',
		accessorKey: 'orderCount',
		header: 'Orders',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-sm font-medium'>{row.original.orderCount}</span>
		),
	},
];

const caseVolumeCol: CustomColumnDef<CustomerRow> = {
	id: 'caseVolume',
	accessorKey: 'caseVolume',
	header: () => (
		<span className='flex items-center gap-1'>
			Case Volume
			<CustomTooltip content={cust.caseVolume} />
		</span>
	),
	enableSorting: false,
	cell: ({ row }) => (
		<span className='text-sm font-medium'>
			{row.original.caseVolume.toLocaleString()}
		</span>
	),
};

const financialColumns: CustomColumnDef<CustomerRow>[] = [
	{
		accessorKey: 'grossRevenue',
		header: 'Gross Revenue',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-sm font-medium'>
				${row.original.grossRevenue.toLocaleString()}
			</span>
		),
	},
	{
		accessorKey: 'netRevenue',
		header: 'Net Revenue',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-sm font-medium'>
				${row.original.netRevenue.toLocaleString()}
			</span>
		),
	},
	{
		accessorKey: 'grossProfit',
		header: () => (
			<span className='flex items-center gap-1'>
				Gross Profit
				<CustomTooltip content={cust.grossProfit} />
			</span>
		),
		enableSorting: true,
		cell: ({ row }) => (
			<span
				className={`text-sm font-medium ${row.original.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
			>
				${row.original.grossProfit.toLocaleString()}
			</span>
		),
	},
	{
		accessorKey: 'netAov',
		header: () => (
			<span className='flex items-center gap-1'>
				Net AOV
				<CustomTooltip content={cust.netAov} />
			</span>
		),
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-sm'>${row.original.netAov.toLocaleString()}</span>
		),
	},
	{
		accessorKey: 'lastOrderDate',
		header: 'Last Order',
		enableSorting: true,
		cell: ({ row }) => (
			<span className='text-sm text-muted-foreground'>
				{row.original.lastOrderDate
					? formatDistanceToNow(new Date(row.original.lastOrderDate), {
							addSuffix: true,
						})
					: 'Never'}
			</span>
		),
	},
];

export const getCustomerListCols = (): CustomColumnDef<CustomerRow>[] => [
	...baseColumns,
	caseVolumeCol,
	...financialColumns,
];
