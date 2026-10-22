'use client';

import type { SkuColumnType, SkuSettingType } from '@repo/types';
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import {
	useDeleteSkuColumn,
	useDeleteSkuSetting,
	useUpdateSkuColumn,
} from '@/queries';
import { AddUpdateSkuDialog } from './AddUpdateSkuDialog';
import { RenameColumnDialog } from './RenameColumnDialog';

/**
 * Encapsulates the four row/column actions (edit/delete SKU, rename/delete
 * column) and the dialogs they drive, reusing the existing grid-agnostic
 * dialog components. Returns openers plus a <Dialogs /> element to render once.
 */
export function useSkuActions() {
	const { mutate: deleteSku, isPending: isDeletingSku } = useDeleteSkuSetting();
	const { mutate: updateColumn, isPending: isRenaming } = useUpdateSkuColumn();
	const { mutate: deleteColumn, isPending: isDeletingColumn } =
		useDeleteSkuColumn();

	const [skuDialogOpen, setSkuDialogOpen] = useState(false);
	const [editingSku, setEditingSku] = useState<SkuSettingType | null>(null);
	const [deleteSkuTarget, setDeleteSkuTarget] = useState<SkuSettingType | null>(
		null
	);
	const [renameTarget, setRenameTarget] = useState<SkuColumnType | null>(null);
	const [renameValue, setRenameValue] = useState('');
	const [deleteColumnTarget, setDeleteColumnTarget] =
		useState<SkuColumnType | null>(null);

	const addSku = () => {
		setEditingSku(null);
		setSkuDialogOpen(true);
	};
	const editSku = (row: SkuSettingType) => {
		setEditingSku(row);
		setSkuDialogOpen(true);
	};
	const requestDeleteSku = (row: SkuSettingType) => setDeleteSkuTarget(row);
	const renameColumn = (col: SkuColumnType) => {
		setRenameTarget(col);
		setRenameValue(col.name);
	};
	const requestDeleteColumn = (col: SkuColumnType) =>
		setDeleteColumnTarget(col);

	const handleRename = () => {
		if (!renameTarget) return;
		const name = renameValue.trim();
		if (!name || name === renameTarget.name) {
			setRenameTarget(null);
			return;
		}
		updateColumn(
			{ id: renameTarget.id, input: { name } },
			{ onSuccess: () => setRenameTarget(null) }
		);
	};

	const dialogs = (
		<>
			<AddUpdateSkuDialog
				open={skuDialogOpen}
				onClose={() => {
					setSkuDialogOpen(false);
					setEditingSku(null);
				}}
				editingSku={editingSku}
			/>

			<RenameColumnDialog
				column={renameTarget}
				value={renameValue}
				onValueChange={setRenameValue}
				onClose={() => setRenameTarget(null)}
				onSave={handleRename}
				isSaving={isRenaming}
			/>

			<CustomAlertDialog
				isOpen={!!deleteSkuTarget}
				onClose={() => setDeleteSkuTarget(null)}
				onConfirm={() => {
					if (!deleteSkuTarget) return;
					deleteSku(deleteSkuTarget.id, {
						onSuccess: () => setDeleteSkuTarget(null),
					});
				}}
				isLoading={isDeletingSku}
				title='Delete SKU?'
				description={`"${deleteSkuTarget?.sku ?? ''}" will be permanently removed. This action cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
			/>

			<CustomAlertDialog
				isOpen={!!deleteColumnTarget}
				onClose={() => setDeleteColumnTarget(null)}
				onConfirm={() => {
					if (!deleteColumnTarget) return;
					deleteColumn(deleteColumnTarget.id, {
						onSuccess: () => setDeleteColumnTarget(null),
					});
				}}
				isLoading={isDeletingColumn}
				title='Delete column?'
				description={`"${deleteColumnTarget?.name ?? ''}" and all its values across SKUs will be permanently removed. This action cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
			/>
		</>
	);

	return {
		addSku,
		editSku,
		requestDeleteSku,
		renameColumn,
		requestDeleteColumn,
		dialogs,
	};
}
