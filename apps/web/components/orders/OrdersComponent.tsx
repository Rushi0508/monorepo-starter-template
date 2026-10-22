'use client';

import type { OrderFilterType, OrderItem } from '@repo/types';
import { type SortingState } from '@tanstack/react-table';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useOrders } from '@/queries';
import Searchbar from '../Searchbar';
import { OrderDetailSheet } from './OrderDetailSheet';
import OrdersFilters, { EMPTY_ORDER_FILTERS } from './OrdersFilters';
import { orderListCols } from './order-list-cols';

const OrdersComponent = () => {
	const { filters, setFilters } =
		useQueryFilters<OrderFilterType>(EMPTY_ORDER_FILTERS);
	const [debouncedSearch] = useDebounce(filters.search, 500);
	const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data, isLoading, error } = useOrders({
		...filters,
		search: debouncedSearch,
	});

	const sortingState: SortingState = filters.sortBy
		? [{ id: filters.sortBy, desc: filters.sortOrder === 'desc' }]
		: [];

	const handleSearch = (value: string) =>
		setFilters({ ...filters, search: value, page: 1 });

	const handleRowClick = (row: OrderItem) => {
		setSelectedOrder(row);
		setSheetOpen(true);
	};

	const handlePaginationChange = (page: number, limit: number) => {
		setFilters({ ...filters, page, limit });
	};

	const handleSortingChange = (newSorting: SortingState) => {
		const sort = newSorting[0];
		setFilters({
			...filters,
			page: 1,
			sortBy: sort?.id as OrderFilterType['sortBy'],
			sortOrder: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
		});
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Orders'
				description='Shopify orders with payment and fulfillment status. Click a row to view line items and details.'
			/>

			<div className='flex items-center justify-between gap-3'>
				<Searchbar
					onChange={handleSearch}
					value={filters.search}
					placeholder='Search order #, customer, company, email, tags...'
				/>
				<OrdersFilters appliedFilters={filters} onApply={setFilters} />
			</div>

			{isLoading && <TableSkeleton />}
			{error && <AlertMessage message={error.message} variant='destructive' />}

			{data && (
				<CustomTable<OrderItem>
					data={data.data}
					columns={orderListCols}
					onRowClick={handleRowClick}
					enablePagination
					paginationMode='server'
					pageSize={filters.limit}
					currentPage={filters.page}
					totalCount={data.totalCount}
					onPaginationChange={handlePaginationChange}
					enableSorting
					sortingMode='server'
					sortingState={sortingState}
					onSortingChange={handleSortingChange}
					emptyState={
						<EmptyMessage
							message='No orders found'
							description='No orders match your current filters.'
							icon={<ShoppingCart className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			)}

			<OrderDetailSheet
				order={selectedOrder}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
};

export default OrdersComponent;
