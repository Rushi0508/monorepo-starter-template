'use client';

import type { FulfillmentFilterType } from '@repo/types';
import { formatDateLabel } from '@repo/utils';
import type { SortingState } from '@tanstack/react-table';
import { useDebounce } from 'use-debounce';
import AlertMessage from '@/components/general/AlertMessage';
import { PageHeader } from '@/components/general/PageHeader';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useFulfillment } from '@/queries';
import Searchbar from '../Searchbar';
import TableSkeleton from '../skeletons/TableSkeleton';
import FulfillmentFilters, {
	EMPTY_FULFILLMENT_FILTERS,
} from './FulfillmentFilters';
import {
	FulfillmentMetricsCards,
	FulfillmentMetricsSkeleton,
} from './FulfillmentMetrics';
import { FulfillmentTable } from './FulfillmentTable';

const FulfillmentComponent = () => {
	const { filters, setFilters } = useQueryFilters<FulfillmentFilterType>(
		EMPTY_FULFILLMENT_FILTERS
	);

	const [debouncedSearch] = useDebounce(filters.search, 500);

	const { data, isLoading, error } = useFulfillment({
		...filters,
		search: debouncedSearch,
	});

	const handleSearch = (value: string) =>
		setFilters({ ...filters, search: value, page: 1 });

	const handlePaginationChange = (page: number, limit: number) => {
		setFilters({ ...filters, page, limit });
	};

	const sortingState: SortingState = filters.sortBy
		? [{ id: filters.sortBy, desc: filters.sortOrder === 'desc' }]
		: [];

	const handleSortingChange = (newSorting: SortingState) => {
		const sort = newSorting[0];
		setFilters({
			...filters,
			page: 1,
			sortBy: sort?.id as FulfillmentFilterType['sortBy'],
			sortOrder: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
		});
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Fulfillment & Tracking'
				description={`Track every order from placement to delivery with real-time metrics. (${formatDateLabel(filters.orderDateStart, filters.orderDateEnd)})`}
			/>

			<div className='flex items-center justify-between gap-3'>
				<Searchbar
					onChange={handleSearch}
					value={filters.search}
					placeholder='Search order #, customer, email...'
				/>
				<FulfillmentFilters appliedFilters={filters} onApply={setFilters} />
			</div>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{isLoading && <FulfillmentMetricsSkeleton />}
			{data && <FulfillmentMetricsCards metrics={data.metrics} />}

			{isLoading && <TableSkeleton />}
			{data && (
				<FulfillmentTable
					data={data.data}
					totalCount={data.totalCount}
					page={data.page}
					limit={data.limit}
					onPaginationChange={handlePaginationChange}
					sortingState={sortingState}
					onSortingChange={handleSortingChange}
				/>
			)}
		</div>
	);
};

export default FulfillmentComponent;
