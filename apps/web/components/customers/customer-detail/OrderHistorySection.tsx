'use client';

import type { GetCustomerDetailResponseType, OrderItem } from '@repo/types';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import { OrderDetailSheet } from '@/components/orders/OrderDetailSheet';
import { orderListCols } from '@/components/orders/order-list-cols';

interface OrderHistorySectionProps {
	customer: GetCustomerDetailResponseType;
}

const EXCLUDED_KEYS = new Set<keyof OrderItem>(['customerDisplayName']);
const historyCols = orderListCols.filter(
	(col) =>
		!(
			'accessorKey' in col &&
			EXCLUDED_KEYS.has(col.accessorKey as keyof OrderItem)
		)
);

const OrderHistorySection = ({ customer }: OrderHistorySectionProps) => {
	const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleRowClick = (order: OrderItem) => {
		setSelectedOrder(order);
		setSheetOpen(true);
	};

	return (
		<div className='overflow-hidden rounded-lg border bg-card'>
			<div className='border-b px-5 py-4'>
				<h2 className='text-sm font-semibold'>
					Order History{' '}
					<span className='text-muted-foreground font-normal'>
						· {customer.totalOrders} orders
					</span>
				</h2>
			</div>
			<CustomTable
				data={customer.orderHistory}
				columns={historyCols}
				enablePagination
				enableSorting
				sortingMode='client'
				paginationMode='client'
				pageSize={10}
				onRowClick={handleRowClick}
				className='rounded-none! border-0!'
				paginationClassName='mt-0 border-t px-5 py-3'
				emptyState={
					<EmptyMessage
						message='No orders found'
						description='This customer has no order history.'
						icon={<Package className='size-8 text-muted-foreground' />}
					/>
				}
			/>
			<OrderDetailSheet
				order={selectedOrder}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
};

export default OrderHistorySection;
