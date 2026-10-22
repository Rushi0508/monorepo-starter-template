import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui/components/table';
import { cn } from '@repo/ui/lib/utils';
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import React from 'react';
import PaginationControls from './PaginationControls';

export type CustomColumnDef<TData, TValue = unknown> = ColumnDef<
	TData,
	TValue
> & {
	headerClassName?: string;
	cellClassName?: string;
};

type CustomTableProps<TData> = Readonly<{
	data: readonly TData[];
	columns: readonly CustomColumnDef<TData>[];
	enableSorting?: boolean;
	enableFiltering?: boolean;
	enablePagination?: boolean;
	headerClassName?: string;
	cellClassName?: string;
	className?: string;
	paginationClassName?: string;
	emptyState?: React.ReactNode;
	onRowClick?: (row: TData) => void;
	getRowClassName?: (row: TData, depth: number) => string;
	/** Nested rows; a row with sub-rows expands on click */
	getSubRows?: (row: TData) => TData[] | undefined;

	// Pagination props
	paginationMode?: 'client' | 'server';
	pageSize?: number;
	totalCount?: number;
	currentPage?: number;
	onPaginationChange?: (page: number, pageSize: number) => void;

	// Sorting props
	sortingMode?: 'client' | 'server';
	sortingState?: SortingState;
	onSortingChange?: (sorting: SortingState) => void;

	// Filtering props
	filteringMode?: 'client' | 'server';
	onFilteringChange?: (filters: ColumnFiltersState) => void;
	globalFilter?: string;
	onGlobalFilterChange?: (filter: string) => void;
}>;

export function CustomTable<TData>({
	data,
	columns,
	enableSorting = false,
	enableFiltering = false,
	enablePagination = false,
	headerClassName = 'text-primary font-semibold',
	cellClassName = 'text-primary',
	className = '',
	paginationClassName,
	emptyState,
	paginationMode = 'client',
	pageSize = 10,
	totalCount,
	currentPage = 1,
	onPaginationChange,
	sortingMode = 'client',
	sortingState: externalSortingState,
	onSortingChange: externalOnSortingChange,
	filteringMode = 'client',
	onFilteringChange: externalOnFilteringChange,
	globalFilter,
	onGlobalFilterChange,
	onRowClick,
	getRowClassName,
	getSubRows,
}: CustomTableProps<TData>) {
	const [sorting, setSorting] = React.useState<SortingState>(
		externalSortingState ?? []
	);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageIndex: currentPage - 1,
		pageSize: pageSize,
	});

	// Keep sort indicators in sync when external sort state changes (e.g. URL reset).
	React.useEffect(() => {
		if (externalSortingState !== undefined) {
			setSorting(externalSortingState);
		}
	}, [externalSortingState]);

	// Sync external pagination state
	React.useEffect(() => {
		if (
			paginationMode === 'server' &&
			currentPage !== pagination.pageIndex + 1
		) {
			setPagination((prev) => ({ ...prev, pageIndex: currentPage - 1 }));
		}
	}, [currentPage, pagination.pageIndex, paginationMode]);

	// Handle sorting changes
	const handleSortingChange = (
		updaterOrValue: SortingState | ((old: SortingState) => SortingState)
	) => {
		const newSorting =
			typeof updaterOrValue === 'function'
				? updaterOrValue(sorting)
				: updaterOrValue;
		setSorting(newSorting);
		if (sortingMode === 'server' && externalOnSortingChange) {
			externalOnSortingChange(newSorting);
		}
	};

	// Handle filtering changes
	const handleFilteringChange = (
		updaterOrValue:
			| ColumnFiltersState
			| ((old: ColumnFiltersState) => ColumnFiltersState)
	) => {
		const newFilters =
			typeof updaterOrValue === 'function'
				? updaterOrValue(columnFilters)
				: updaterOrValue;
		setColumnFilters(newFilters);
		if (filteringMode === 'server' && externalOnFilteringChange) {
			externalOnFilteringChange(newFilters);
		}
	};

	const table = useReactTable({
		data: data as TData[],
		columns: columns as CustomColumnDef<TData>[],
		getCoreRowModel: getCoreRowModel(),
		...(getSubRows && {
			getSubRows,
			getExpandedRowModel: getExpandedRowModel(),
		}),
		...(enableSorting && {
			getSortedRowModel:
				sortingMode === 'client' ? getSortedRowModel() : undefined,
			onSortingChange: handleSortingChange,
			manualSorting: sortingMode === 'server',
		}),
		...(enableFiltering && {
			getFilteredRowModel:
				filteringMode === 'client' ? getFilteredRowModel() : undefined,
			onColumnFiltersChange: handleFilteringChange,
			manualFiltering: filteringMode === 'server',
			...(globalFilter !== undefined && { globalFilter }),
			...(onGlobalFilterChange && { onGlobalFilterChange }),
		}),
		...(enablePagination &&
			paginationMode === 'client' && {
				getPaginationRowModel: getPaginationRowModel(),
			}),
		...(enablePagination && {
			onPaginationChange: setPagination,
		}),
		state: {
			sorting,
			columnFilters,
			...(enablePagination && { pagination }),
			...(globalFilter !== undefined && { globalFilter }),
		},
		...(paginationMode === 'server' &&
			totalCount && {
				pageCount: Math.ceil(totalCount / pagination.pageSize),
				manualPagination: true,
			}),
	});

	const handlePageChange = (page: number) => {
		if (paginationMode === 'server' && onPaginationChange) {
			onPaginationChange(page, pagination.pageSize);
		} else {
			table.setPageIndex(page - 1);
		}
	};

	const handlePageSizeChange = (newPageSize: number) => {
		if (paginationMode === 'server' && onPaginationChange) {
			onPaginationChange(1, newPageSize);
		}
		table.setPageSize(newPageSize);
	};

	const hasFooter = columns.some((column) => column.footer != null);

	const pageCount =
		paginationMode === 'server' && totalCount
			? Math.ceil(totalCount / pagination.pageSize)
			: table.getPageCount();

	return (
		<div>
			<div className={`rounded-xl overflow-hidden border bg-card ${className}`}>
				<Table>
					<TableHeader className='bg-muted'>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										className={cn(
											headerClassName,
											(header.column.columnDef as CustomColumnDef<TData>)
												.headerClassName
										)}
										key={header.id}
									>
										{header.isPlaceholder ? null : header.column.getCanSort() ? (
											<button
												type='button'
												className='flex items-center gap-2 cursor-pointer select-none [text-transform:inherit]'
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												<span className='inline-flex'>
													{header.column.getIsSorted() === 'asc' ? (
														<ArrowUp className='h-4 w-4' />
													) : header.column.getIsSorted() === 'desc' ? (
														<ArrowDown className='h-4 w-4' />
													) : (
														<ArrowUpDown className='h-4 w-4 text-muted-foreground' />
													)}
												</span>
											</button>
										) : (
											flexRender(
												header.column.columnDef.header,
												header.getContext()
											)
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className={cn(
										(onRowClick || row.getCanExpand()) && 'cursor-pointer',
										getRowClassName?.(row.original, row.depth)
									)}
									onClick={() => {
										if (row.getCanExpand()) row.toggleExpanded();
										onRowClick?.(row.original);
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											className={cn(
												cellClassName,
												(cell.column.columnDef as CustomColumnDef<TData>)
													.cellClassName
											)}
											key={cell.id}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className='h-24'>
									{emptyState || <div className='text-center'>No results.</div>}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					{hasFooter && (
						<TableFooter>
							{table.getFooterGroups().map((footerGroup) => (
								<TableRow key={footerGroup.id}>
									{footerGroup.headers.map((header) => (
										<TableCell
											className={cn(
												cellClassName,
												'font-semibold',
												(header.column.columnDef as CustomColumnDef<TData>)
													.cellClassName
											)}
											key={header.id}
										>
											{flexRender(
												header.column.columnDef.footer,
												header.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableFooter>
					)}
				</Table>
			</div>

			{enablePagination && pageCount > 1 && (
				<PaginationControls
					currentPage={pagination.pageIndex + 1}
					pageCount={pageCount}
					goToPage={handlePageChange}
					limit={pagination.pageSize}
					setLimit={handlePageSizeChange}
					totalCount={totalCount}
					className={paginationClassName}
				/>
			)}
		</div>
	);
}
