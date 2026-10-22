'use client';

import type { IHeaderParams } from 'ag-grid-community';
import { ArrowDown, ArrowUp, ListFilter } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Custom header: click the label to cycle sort; a filter icon opens that
 * column's (Set) filter popup and gets a highlighted background when a filter is
 * active. Rename/delete live in the header right-click menu (see getMainMenuItems).
 */
export const ColumnHeader = (params: IHeaderParams) => {
	const { displayName, column, setSort, api } = params;
	const [sort, setSortState] = useState(column.getSort());
	const [filterActive, setFilterActive] = useState(column.isFilterActive());

	useEffect(() => {
		const onSort = () => setSortState(column.getSort());
		const onFilter = () => setFilterActive(column.isFilterActive());
		column.addEventListener('sortChanged', onSort);
		column.addEventListener('filterActiveChanged', onFilter);
		return () => {
			column.removeEventListener('sortChanged', onSort);
			column.removeEventListener('filterActiveChanged', onFilter);
		};
	}, [column]);

	const cycleSort = (e: React.MouseEvent) => {
		const next = sort === 'asc' ? 'desc' : sort === 'desc' ? null : 'asc';
		setSort(next, e.shiftKey);
	};

	return (
		<div className='flex w-full items-center gap-1'>
			<button
				type='button'
				onClick={cycleSort}
				className='flex flex-1 items-center gap-1 truncate text-left font-medium'
			>
				<span className='truncate'>{displayName}</span>
				{sort === 'asc' && <ArrowUp className='size-3 shrink-0' />}
				{sort === 'desc' && <ArrowDown className='size-3 shrink-0' />}
			</button>

			<button
				type='button'
				title={filterActive ? 'Filtered — click to edit' : 'Filter'}
				onClick={() => api.showColumnFilter(column.getColId())}
				className={`rounded p-0.5 ${
					filterActive
						? 'bg-primary/20 text-primary'
						: 'text-muted-foreground hover:bg-muted'
				}`}
			>
				<ListFilter className='size-3.5' />
			</button>
		</div>
	);
};
