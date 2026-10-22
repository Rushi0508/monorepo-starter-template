'use client';

import type { SkuColumnType } from '@repo/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useReorderSkuColumns, useSkuSettings } from '@/queries';
import { SkuService } from '@/services';
import type { EditableRow, SaveStatus } from './types';
import { AUTOSAVE_DEBOUNCE_MS, snapshotFields, toEditable } from './utils';

/**
 * Grid-agnostic state for the SKU settings table: local editable rows, dynamic
 * columns, a debounced autosave for cell edits, duplicate-value highlighting,
 * and column reordering. Both the AG Grid and TanStack implementations build
 * their UI on top of this — no imperative grid instance involved.
 */
export function useSkuGrid() {
	const { data, isLoading, error } = useSkuSettings();
	const { mutate: reorderColumnsMutation } = useReorderSkuColumns();

	const [rows, setRows] = useState<EditableRow[]>([]);
	const [columns, setColumns] = useState<SkuColumnType[]>([]);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

	// Mirrors for async autosave so debounced saves read the latest values.
	const rowsRef = useRef<EditableRow[]>([]);
	rowsRef.current = rows;
	const savedRef = useRef<Record<string, Record<string, string>>>({});
	const dirtyRef = useRef<Set<string>>(new Set());
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inFlightRef = useRef(false);

	useEffect(() => {
		if (!data) return;
		const editable = (data.data ?? []).map(toEditable);
		setRows(editable);
		setColumns(data.columns ?? []);
		savedRef.current = snapshotFields(editable);
		dirtyRef.current.clear();
		setSaveStatus('idle');
	}, [data]);

	const flush = useCallback(async () => {
		if (inFlightRef.current) return;
		const dirtySkus = dirtyRef.current;
		if (dirtySkus.size === 0) {
			setSaveStatus('idle');
			return;
		}
		const updates = rowsRef.current
			.filter((r) => dirtySkus.has(r.sku))
			.map((r) => ({ sku: r.sku, customFields: { ...r._customFields } }));

		inFlightRef.current = true;
		dirtyRef.current = new Set();
		setSaveStatus('saving');
		try {
			await SkuService.updateSkuSettings({ updates });
			for (const u of updates) {
				savedRef.current[u.sku] = { ...u.customFields };
			}
			inFlightRef.current = false;
			// Anything edited during the save request stays dirty — save again.
			if (dirtyRef.current.size > 0) {
				flush();
			} else {
				setSaveStatus('saved');
			}
		} catch (e) {
			inFlightRef.current = false;
			// Re-mark so the next edit/flush retries these rows.
			for (const u of updates) dirtyRef.current.add(u.sku);
			setSaveStatus('error');
			toast.error(
				e instanceof Error ? e.message : 'Failed to save SKU settings'
			);
		}
	}, []);

	const scheduleSave = useCallback(() => {
		setSaveStatus('pending');
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			flush();
		}, AUTOSAVE_DEBOUNCE_MS);
	}, [flush]);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[]
	);

	/**
	 * Record a cell edit and schedule an autosave. The value is written into the
	 * existing row object in place — we deliberately do NOT replace `rows`.
	 * AG Grid resets its undo/redo stack whenever `rowData` is swapped, so an
	 * immutable update here would break Cmd/Ctrl+Z. AG Grid already reflects the
	 * new value via its editor; this just keeps our autosave snapshot in sync.
	 */
	const updateCell = useCallback(
		(sku: string, columnId: string, value: string) => {
			const row = rowsRef.current.find((r) => r.sku === sku);
			if (row) row._customFields[columnId] = value;
			dirtyRef.current.add(sku);
			scheduleSave();
		},
		[scheduleSave]
	);

	/** Persist a new column order; optimistic with rollback on failure. */
	const reorderColumns = useCallback(
		(orderedIds: string[]) => {
			const previous = columns;
			const byId = new Map(previous.map((c) => [c.id, c]));
			const next = orderedIds
				.map((id, index) => {
					const col = byId.get(id);
					return col ? { ...col, position: index } : null;
				})
				.filter((c): c is SkuColumnType => c !== null);
			if (next.length !== previous.length) return;

			setColumns(next);
			reorderColumnsMutation(
				{ orderedIds },
				{ onError: () => setColumns(previous) }
			);
		},
		[columns, reorderColumnsMutation]
	);

	return {
		isLoading,
		error,
		rows,
		rowsRef,
		columns,
		saveStatus,
		updateCell,
		reorderColumns,
	};
}
