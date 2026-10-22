'use client';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@repo/ui/components/popover';
import { History, Plus, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import LoadingButton from '@/components/general/LoadingButton';
import { useCreateSkuColumn } from '@/queries';
import { SkuAuditLogSheet } from './SkuAuditLogSheet';
import type { SaveStatus } from './types';

const SAVE_LABEL: Record<SaveStatus, string> = {
	idle: '',
	pending: 'Unsaved changes…',
	saving: 'Saving…',
	saved: 'Saved',
	error: 'Save failed',
};

/** Shared header for the alternative grids: title, save status, add column/SKU,
 * audit logs. Manages its own add-column popover and audit sheet. */
export const SkuToolbar = ({
	title,
	saveStatus,
	onAddSku,
}: {
	title: string;
	saveStatus: SaveStatus;
	onAddSku: () => void;
}) => {
	const [auditOpen, setAuditOpen] = useState(false);
	const [addColumnOpen, setAddColumnOpen] = useState(false);
	const [columnName, setColumnName] = useState('');
	const { mutate: createColumn, isPending } = useCreateSkuColumn();

	const handleAddColumn = () => {
		const name = columnName.trim();
		if (!name) return;
		createColumn(
			{ name },
			{
				onSuccess: () => {
					setColumnName('');
					setAddColumnOpen(false);
				},
			}
		);
	};

	return (
		<>
			<div className='flex max-h-14 shrink-0 items-center justify-between border-b px-5 py-4'>
				<div className='flex items-center gap-3'>
					<h2 className='text-sm font-semibold'>{title}</h2>
					<span
						className={
							saveStatus === 'error'
								? 'text-xs text-destructive'
								: 'text-xs text-muted-foreground'
						}
					>
						{SAVE_LABEL[saveStatus]}
					</span>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setAuditOpen(true)}
					>
						<History className='size-3.5' />
						View audit logs
					</Button>
					<Popover open={addColumnOpen} onOpenChange={setAddColumnOpen}>
						<PopoverTrigger asChild>
							<Button variant='subtle' size='sm'>
								<Plus className='size-3.5' />
								Add column
							</Button>
						</PopoverTrigger>
						<PopoverContent align='end' className='w-56 space-y-2 p-3'>
							<p className='text-xs font-medium'>New column name</p>
							<Input
								className='h-8 text-sm'
								placeholder='e.g. Safety Stock'
								value={columnName}
								onChange={(e) => setColumnName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleAddColumn();
								}}
								autoFocus
							/>
							<LoadingButton
								size='sm'
								className='w-full'
								onClick={handleAddColumn}
								isLoading={isPending}
								disabled={!columnName.trim() || isPending}
							>
								Add column
							</LoadingButton>
						</PopoverContent>
					</Popover>
					<Button size='sm' onClick={onAddSku}>
						<PlusCircle className='size-3.5' />
						Add SKU
					</Button>
				</div>
			</div>
			<SkuAuditLogSheet open={auditOpen} setOpen={setAuditOpen} />
		</>
	);
};
