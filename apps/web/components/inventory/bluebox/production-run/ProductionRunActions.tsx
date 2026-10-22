'use client';

import type { ProductionRunType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { CheckCircle2, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import {
	useDeleteBlueboxProductionRun,
	useUpdateBlueboxProductionRun,
} from '@/queries';

export const ProductionRunActions = ({ run }: { run: ProductionRunType }) => {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const update = useUpdateBlueboxProductionRun();
	const remove = useDeleteBlueboxProductionRun();
	const completed = run.completedAt != null;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						className='size-8'
						disabled={update.isPending}
						aria-label='Production run actions'
					>
						<MoreHorizontal className='size-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-44'>
					<DropdownMenuItem
						onClick={() => update.mutate({ id: run.id, completed: !completed })}
					>
						{completed ? (
							<RotateCcw className='size-4' />
						) : (
							<CheckCircle2 className='size-4' />
						)}
						{completed ? 'Reopen' : 'Mark complete'}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						onClick={() => setConfirmDelete(true)}
					>
						<Trash2 className='size-4' />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CustomAlertDialog
				isOpen={confirmDelete}
				onClose={() => setConfirmDelete(false)}
				onConfirm={() =>
					remove.mutate(run.id, { onSuccess: () => setConfirmDelete(false) })
				}
				isLoading={remove.isPending}
				title={`Delete ${run.runNumber}?`}
				description='The run is removed for good and stops counting toward In Production.'
				confirmText='Delete'
			/>
		</>
	);
};
