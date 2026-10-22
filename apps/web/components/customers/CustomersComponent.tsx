'use client';

import { MAX_SAMPLE_ORDER_CUSTOMERS } from '@repo/constants';
import type { CustomerFilterType, GetCustomersResponseType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { formatDateLabel } from '@repo/utils';
import { type SortingState } from '@tanstack/react-table';
import { PackageIcon, UserPlusIcon, Users, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useRedirect } from '@/hooks/useRedirect';
import { useCustomers } from '@/queries';
import AlertMessage from '../general/AlertMessage';
import EmptyMessage from '../general/EmptyMessage';
import Searchbar from '../Searchbar';
import AddCustomerDialog from './AddCustomerDialog';
import CustomersFilters, { EMPTY_FILTERS } from './CustomersFilters';
import { getCustomerListCols } from './customer-list-cols';
import SampleOrderDialog, {
	type SampleOrderRecipient,
} from './SampleOrderDialog';

type CustomerRow = GetCustomersResponseType['data'][number];

const CustomersComponent = () => {
	const { filters, setFilters } =
		useQueryFilters<CustomerFilterType>(EMPTY_FILTERS);
	const [debouncedSearch] = useDebounce(filters.search, 500);

	const { redirectCustomer } = useRedirect();

	// Keyed by id and kept across pages, so a selection survives paging,
	// sorting and filtering until each customer gets an order or it is cleared.
	const [selected, setSelected] = useState<Map<string, SampleOrderRecipient>>(
		new Map()
	);
	const [sampleOrderOpen, setSampleOrderOpen] = useState(false);
	const [addCustomerOpen, setAddCustomerOpen] = useState(false);

	const {
		data: customers,
		isLoading,
		error,
	} = useCustomers({
		...filters,
		search: debouncedSearch,
	});

	const sortingState: SortingState = filters.sortBy
		? [{ id: filters.sortBy, desc: filters.sortOrder === 'desc' }]
		: [];

	const handleSearch = (value: string) => {
		setFilters({ ...filters, search: value, page: 1 });
	};

	const handleRowClick = (row: CustomerRow) => {
		redirectCustomer(row.id);
	};

	const handlePaginationChange = (page: number, limit: number) => {
		setFilters({ ...filters, page, limit });
	};

	const handleSortingChange = (newSorting: SortingState) => {
		const sort = newSorting[0];
		setFilters({
			...filters,
			page: 1,
			sortBy: sort?.id as CustomerFilterType['sortBy'],
			sortOrder: sort ? (sort.desc ? 'desc' : 'asc') : undefined,
		});
	};

	const pageRows = customers?.data;

	const visibleColumns = useMemo((): CustomColumnDef<CustomerRow>[] => {
		const toRecipient = (row: CustomerRow): SampleOrderRecipient => ({
			id: row.id,
			name: row.name || row.displayName || row.email,
			defaultAddress: row.defaultAddress,
		});
		const setRows = (rows: CustomerRow[], checked: boolean) =>
			setSelected((prev) => {
				const next = new Map(prev);
				for (const row of rows) {
					if (checked) next.set(row.id, toRecipient(row));
					else next.delete(row.id);
				}
				return next;
			});

		const rows = pageRows ?? [];
		const selectedOnPage = rows.filter((r) => selected.has(r.id)).length;

		return [
			{
				id: 'select',
				enableSorting: false,
				headerClassName: 'w-10',
				cellClassName: 'w-10',
				header: () => (
					<Checkbox
						aria-label='Select all customers on this page'
						checked={
							rows.length > 0 && selectedOnPage === rows.length
								? true
								: selectedOnPage > 0
									? 'indeterminate'
									: false
						}
						onCheckedChange={(checked) => setRows(rows, checked === true)}
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						aria-label='Select customer'
						checked={selected.has(row.original.id)}
						onClick={(e) => e.stopPropagation()}
						onCheckedChange={(checked) =>
							setRows([row.original], checked === true)
						}
					/>
				),
			},
			...getCustomerListCols(),
		];
	}, [pageRows, selected]);

	const tooManySelected = selected.size > MAX_SAMPLE_ORDER_CUSTOMERS;

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Customers'
				description={`Customers across all channels, with orders, revenue and profit. (${formatDateLabel(filters.orderDateStart, filters.orderDateEnd)})`}
			/>

			<div className='flex items-center justify-between'>
				<Searchbar
					onChange={handleSearch}
					value={filters.search}
					inputClassName='w-90'
					placeholder='Search name, company, email, city, state, tags...'
				/>
				<div className='flex items-center gap-2'>
					{selected.size > 0 && (
						<>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setSelected(new Map())}
							>
								<XIcon className='size-4' />
								Clear
							</Button>
							<Button
								onClick={() => setSampleOrderOpen(true)}
								disabled={tooManySelected}
								title={
									tooManySelected
										? `Select at most ${MAX_SAMPLE_ORDER_CUSTOMERS} customers`
										: undefined
								}
							>
								<PackageIcon className='size-4' />
								Send sample orders ({selected.size})
							</Button>
						</>
					)}
					<CustomersFilters appliedFilters={filters} onApply={setFilters} />
					<Button variant='outline' onClick={() => setAddCustomerOpen(true)}>
						<UserPlusIcon className='size-4' />
						Add customer
					</Button>
				</div>
			</div>

			<AddCustomerDialog
				open={addCustomerOpen}
				onClose={() => setAddCustomerOpen(false)}
			/>

			<SampleOrderDialog
				customers={[...selected.values()]}
				open={sampleOrderOpen}
				onClose={() => setSampleOrderOpen(false)}
				failedNote='Failed customers are still selected so you can retry.'
				onComplete={({ failedCustomers }) => {
					const failedIds = new Set(failedCustomers.map((c) => c.id));
					setSelected(
						(prev) => new Map([...prev].filter(([id]) => failedIds.has(id)))
					);
				}}
			/>

			{isLoading && <TableSkeleton />}

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{customers && (
				<CustomTable
					data={customers.data}
					columns={visibleColumns}
					onRowClick={handleRowClick}
					enablePagination
					paginationMode='server'
					pageSize={filters.limit}
					currentPage={filters.page}
					totalCount={customers.totalCount}
					onPaginationChange={handlePaginationChange}
					enableSorting
					sortingMode='server'
					sortingState={sortingState}
					onSortingChange={handleSortingChange}
					emptyState={
						<EmptyMessage
							description='No customers match your filters.'
							message='No customers found'
							icon={<Users className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			)}
		</div>
	);
};

export default CustomersComponent;
