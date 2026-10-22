'use client';

import {
	type ColDef,
	type ColumnMovedEvent,
	type DefaultMenuItem,
	type GetContextMenuItemsParams,
	type GetMainMenuItemsParams,
	type GetRowIdParams,
	type GridApi,
	type GridReadyEvent,
	type MenuItemDef,
	ModuleRegistry,
	themeQuartz,
	type ValueSetterParams,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { normalizeCellValue } from '../sku-settings-common/column-rules';
import { SkuCell } from '../sku-settings-common/SkuCell';
import { SkuPricingSheet } from '../sku-settings-common/SkuPricingSheet';
import { SkuToolbar } from '../sku-settings-common/SkuToolbar';
import { useSkuActions } from '../sku-settings-common/sku-actions';
import type { EditableRow } from '../sku-settings-common/types';
import { useSkuGrid } from '../sku-settings-common/use-sku-grid';
import { buildDuplicateValuesByColumn } from '../sku-settings-common/utils';
import { ColumnHeader } from './ColumnHeader';
import './sku-ag-grid.css';

// Enterprise modules power the Excel-style Set Filter (by-value checkboxes).
// No license key is set — an internal tool, so AG Grid logs a watermark warning.
ModuleRegistry.registerModules([AllEnterpriseModule]);

// Spreadsheet-like theme: inherit the app's (Google) font; the surrounding card
// owns the outer border/radius; full faint gridlines like Excel; opaque
// backgrounds so pinned columns/headers don't bleed through on scroll.
const gridTheme = themeQuartz.withParams({
	fontFamily: 'inherit',
	headerFontFamily: 'inherit',
	fontSize: 13,
	headerFontSize: 13,
	headerFontWeight: 600,
	wrapperBorder: false,
	wrapperBorderRadius: 0,
	columnBorder: true,
	headerColumnBorder: true,
	rowBorder: true,
	headerRowBorder: true,
	borderColor: 'var(--border)',
	foregroundColor: 'var(--foreground)',
	accentColor: 'var(--primary)',
	backgroundColor: 'var(--card)',
	headerBackgroundColor: 'var(--muted)',
	oddRowBackgroundColor: 'var(--card)',
	cellHorizontalPadding: 10,
	rowHeight: 58,
	headerHeight: 40,
});

const SKU_COL = '__sku';
const PRICING_COL = '__pricing';

/** Columns the grid owns; everything else is a user-defined custom column. */
const RESERVED_COLS = new Set([SKU_COL, PRICING_COL]);

export const SkuSettingsAgGrid = () => {
	const {
		isLoading,
		error,
		rows,
		rowsRef,
		columns,
		saveStatus,
		updateCell,
		reorderColumns,
	} = useSkuGrid();

	const {
		addSku,
		editSku,
		requestDeleteSku,
		renameColumn,
		requestDeleteColumn,
		dialogs,
	} = useSkuActions();

	const gridApiRef = useRef<GridApi<EditableRow> | null>(null);

	// Opened from the pinned Price and Cost column, or the row's context menu.
	const [pricingSkuId, setPricingSkuId] = useState<string | null>(null);

	// Duplicate highlighting lives in a ref (not React state) so a cell edit can
	// refresh it without replacing `rows` — which would reset AG Grid's undo stack.
	const dupRef = useRef<Map<string, Set<string>>>(new Map());
	const isDup = useCallback((columnId: string, value: unknown) => {
		const normalized = normalizeCellValue(value);
		return Boolean(normalized && dupRef.current.get(columnId)?.has(normalized));
	}, []);

	// Recompute highlights from the live (mutated-in-place) rows and re-run the
	// cell class rules. Called after each edit since edits no longer touch `rows`.
	const refreshDuplicates = useCallback(() => {
		dupRef.current = buildDuplicateValuesByColumn(rowsRef.current, columns);
		gridApiRef.current?.refreshCells({ force: true });
	}, [columns, rowsRef]);

	// Recompute on structural data changes (load, add/delete SKU or column).
	useEffect(() => {
		dupRef.current = buildDuplicateValuesByColumn(rows, columns);
		gridApiRef.current?.refreshCells({ force: true });
	}, [rows, columns]);

	const columnDefs = useMemo<ColDef<EditableRow>[]>(() => {
		const skuCol: ColDef<EditableRow> = {
			colId: SKU_COL,
			headerName: 'SKU',
			pinned: 'left',
			width: 240,
			editable: false,
			lockPosition: 'left',
			suppressMovable: true,
			sortable: true,
			filter: 'agSetColumnFilter',
			// Sort/display by title (falling back to sku); filter by the sku code.
			valueGetter: (p) => p.data?.title || p.data?.sku || '',
			filterValueGetter: (p) => p.data?.sku ?? '',
			// Value-based comparator: null-safe for the Set Filter, which reuses the
			// column comparator to sort its list and calls it without row nodes.
			comparator: (a, b) => {
				const av = String(a ?? '').toLowerCase();
				const bv = String(b ?? '').toLowerCase();
				return av === bv ? 0 : av > bv ? 1 : -1;
			},
			cellClass: 'sku-cell-col',
			cellRenderer: (p: { data?: EditableRow }) =>
				p.data ? (
					<SkuCell
						title={p.data.title}
						sku={p.data.sku}
						channels={p.data.channels}
					/>
				) : null,
			headerComponent: ColumnHeader,
		};

		// A labelled column rather than a click hidden on the SKU cell: the header
		// says what the action is, so it needs no hovering to discover.
		const pricingCol: ColDef<EditableRow> = {
			colId: PRICING_COL,
			headerName: 'Price & Cost',
			width: 70,
			wrapHeaderText: true,
			// autoHeaderHeight: true,
			editable: false,
			sortable: false,
			filter: false,
			suppressMovable: true,
			cellClass: 'cursor-pointer',
			onCellClicked: (p) => {
				if (p.data) setPricingSkuId(p.data.id);
			},
			// The chip is centred by its own full-height flex wrapper rather than by
			// the cell, whose line-height rules do not centre a custom renderer.
			cellRenderer: (p: { data?: EditableRow }) =>
				p.data ? (
					<div className='flex h-full w-full items-center justify-center'>
						<span
							className='inline-flex items-center rounded-md border bg-background p-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground'
							title='Price and cost'
						>
							<Tag className='size-3.5 shrink-0' aria-hidden='true' />
							<span className='sr-only'>Price and cost</span>
						</span>
					</div>
				) : null,
		};

		const customCols: ColDef<EditableRow>[] = columns.map((col) => ({
			colId: col.id,
			headerName: col.name,
			editable: true,
			sortable: true,
			resizable: true,
			filter: 'agSetColumnFilter',
			width: 170,
			valueGetter: (p) => p.data?._customFields[col.id] ?? '',
			valueSetter: (p: ValueSetterParams<EditableRow>) => {
				if (!p.data) return false;
				const next = String(p.newValue ?? '');
				if ((p.data._customFields[col.id] ?? '') === next) return false;
				p.data._customFields[col.id] = next; // AG Grid edits data in place
				updateCell(p.data.sku, col.id, next); // mark dirty + autosave
				refreshDuplicates(); // re-highlight without swapping rowData
				return true;
			},
			cellClassRules: {
				'sku-dup-cell': (p) => isDup(col.id, p.value),
			},
			headerComponent: ColumnHeader,
		}));

		return [skuCol, pricingCol, ...customCols];
	}, [columns, isDup, updateCell, refreshDuplicates]);

	// Right-click a column header → rename / delete (plus AG Grid's default column
	// menu items: pin, autosize, reset columns, etc.).
	const getMainMenuItems = useCallback(
		(params: GetMainMenuItemsParams<EditableRow>) => {
			const col = columns.find((c) => c.id === params.column?.getColId());
			const items: (DefaultMenuItem | MenuItemDef)[] = [];
			if (col) {
				items.push(
					{ name: 'Rename column', action: () => renameColumn(col) },
					{ name: 'Delete column', action: () => requestDeleteColumn(col) },
					'separator'
				);
			}
			items.push(...params.defaultItems);
			return items;
		},
		[columns, renameColumn, requestDeleteColumn]
	);

	// Right-click a row → edit / delete that SKU (replaces the actions column).
	const getContextMenuItems = useCallback(
		(params: GetContextMenuItemsParams<EditableRow>) => {
			const row = params.node?.data;
			const items: (DefaultMenuItem | MenuItemDef)[] = [];
			if (row) {
				items.push(
					{ name: 'Manage pricing', action: () => setPricingSkuId(row.id) },
					{ name: 'Edit SKU', action: () => editSku(row) },
					{ name: 'Delete SKU', action: () => requestDeleteSku(row) },
					'separator'
				);
			}
			// Keep AG Grid's built-in items (copy, export → CSV/Excel, etc.).
			items.push(...(params.defaultItems ?? []));
			return items;
		},
		[editSku, requestDeleteSku]
	);

	const defaultColDef = useMemo<ColDef<EditableRow>>(
		() => ({ resizable: true, suppressHeaderMenuButton: true }),
		[]
	);

	const getRowId = useCallback(
		(p: GetRowIdParams<EditableRow>) => p.data.sku,
		[]
	);

	const handleColumnMoved = useCallback(
		(e: ColumnMovedEvent) => {
			if (!e.finished) return;
			const orderedIds = e.api
				.getColumnState()
				.map((s) => s.colId)
				.filter((id) => id && !RESERVED_COLS.has(id));
			const current = columns.map((c) => c.id);
			if (orderedIds.length !== current.length) return;
			if (orderedIds.every((id, i) => id === current[i])) return;
			reorderColumns(orderedIds as string[]);
		},
		[columns, reorderColumns]
	);

	if (error) {
		return <AlertMessage message={error.message} variant='destructive' />;
	}

	return (
		<div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card'>
			<SkuToolbar
				title='SKU configuration'
				saveStatus={saveStatus}
				onAddSku={addSku}
			/>
			<div className='sku-ag-grid min-h-0 flex-1'>
				<AgGridReact<EditableRow>
					theme={gridTheme}
					loading={isLoading}
					rowData={rows}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					getRowId={getRowId}
					onGridReady={(e: GridReadyEvent<EditableRow>) => {
						gridApiRef.current = e.api;
					}}
					cellSelection
					singleClickEdit={false}
					stopEditingWhenCellsLoseFocus
					undoRedoCellEditing
					undoRedoCellEditingLimit={50}
					suppressMovableColumns={false}
					onColumnMoved={handleColumnMoved}
					getContextMenuItems={getContextMenuItems}
					getMainMenuItems={getMainMenuItems}
					animateRows
				/>
			</div>
			{dialogs}
			<SkuPricingSheet
				skuSettingId={pricingSkuId}
				onClose={() => setPricingSkuId(null)}
			/>
		</div>
	);
};
