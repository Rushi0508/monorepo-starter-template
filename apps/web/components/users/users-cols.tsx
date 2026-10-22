'use client';

import type { UserListItem } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { CustomColumnDef } from '@/components/general/CustomTable';

type GetUsersColumnsOptions = {
	onEdit: (user: UserListItem) => void;
	onDelete: (user: UserListItem) => void;
	currentUserId?: string;
};

export function getUsersColumns({
	onEdit,
	onDelete,
	currentUserId,
}: GetUsersColumnsOptions): CustomColumnDef<UserListItem>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Name',
			enableSorting: false,
			cell: ({ row }) => (
				<span className='font-medium'>{row.original.name}</span>
			),
		},
		{
			accessorKey: 'email',
			header: 'Email',
			enableSorting: false,
			cell: ({ row }) => (
				<span className='text-muted-foreground'>{row.original.email}</span>
			),
		},
		{
			id: 'actions',
			header: '',
			enableSorting: false,
			cell: ({ row }) => {
				const user = row.original;
				const isSelf = user.id === currentUserId;

				return (
					<div className='flex items-center justify-end gap-1'>
						<Button
							variant='ghost'
							size='icon'
							className='size-8'
							onClick={() => onEdit(user)}
							aria-label={`Edit ${user.name}`}
						>
							<Pencil className='size-4' />
						</Button>
						<Button
							variant='ghost'
							size='icon'
							className='size-8 text-destructive hover:text-destructive'
							onClick={() => onDelete(user)}
							disabled={isSelf}
							aria-label={`Delete ${user.name}`}
							title={isSelf ? 'You cannot delete your own account' : undefined}
						>
							<Trash2 className='size-4' />
						</Button>
					</div>
				);
			},
		},
	];
}
