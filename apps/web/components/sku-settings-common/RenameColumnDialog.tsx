'use client';

import type { SkuColumnType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import LoadingButton from '../general/LoadingButton';

type RenameColumnDialogProps = {
	column: SkuColumnType | null;
	value: string;
	onValueChange: (value: string) => void;
	onClose: () => void;
	onSave: () => void;
	isSaving: boolean;
};

export const RenameColumnDialog = ({
	column,
	value,
	onValueChange,
	onClose,
	onSave,
	isSaving,
}: RenameColumnDialogProps) => (
	<Dialog
		open={!!column}
		onOpenChange={(open) => {
			if (!open) onClose();
		}}
	>
		<DialogContent className='sm:max-w-sm'>
			<DialogHeader>
				<DialogTitle>Rename column</DialogTitle>
			</DialogHeader>
			<Input
				className='h-8 text-sm'
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') onSave();
				}}
				autoFocus
			/>
			<DialogFooter>
				<Button variant='outline' size='sm' onClick={onClose}>
					Cancel
				</Button>
				<LoadingButton
					size='sm'
					onClick={onSave}
					isLoading={isSaving}
					disabled={!value.trim() || isSaving}
				>
					Save
				</LoadingButton>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
