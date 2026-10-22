'use client';

import type { UserFilterType, UserListItem } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { PlusCircle, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import { PageHeader } from '@/components/general/PageHeader';
import Searchbar from '@/components/Searchbar';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useDeleteUser, useUsers } from '@/queries';
import { CreateUpdateUserDialog } from './CreateUpdateUserDialog';
import { getUsersColumns } from './users-cols';

const EMPTY_FILTERS: UserFilterType = {
	search: '',
	page: 1,
	limit: 10,
};

const UsersComponent = () => {
	const currentUser = useAuth();
	const { filters, setFilters } =
		useQueryFilters<UserFilterType>(EMPTY_FILTERS);
	const [debouncedSearch] = useDebounce(filters.search, 500);

	const {
		data: users,
		isLoading,
		error,
	} = useUsers({
		...filters,
		search: debouncedSearch,
	});
	const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

	const [formOpen, setFormOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
	const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

	const columns = useMemo(
		() =>
			getUsersColumns({
				currentUserId: currentUser?.id,
				onEdit: (user) => {
					setEditingUser(user);
					setFormOpen(true);
				},
				onDelete: (user) => setUserToDelete(user),
			}),
		[currentUser?.id]
	);

	const handleSearch = (value: string) => {
		setFilters({ ...filters, search: value, page: 1 });
	};

	const handlePaginationChange = (page: number, limit: number) => {
		setFilters({ ...filters, page, limit });
	};

	const handleAddUser = () => {
		setEditingUser(null);
		setFormOpen(true);
	};

	const handleFormClose = () => {
		setFormOpen(false);
		setEditingUser(null);
	};

	const handleDeleteConfirm = () => {
		if (!userToDelete) return;
		deleteUser(userToDelete.id, {
			onSuccess: () => setUserToDelete(null),
		});
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Users'
				description='Manage system users. Added users can sign in with their email.'
				actions={
					<Button onClick={handleAddUser}>
						<PlusCircle className='size-4' />
						Add User
					</Button>
				}
			/>

			<Searchbar
				onChange={handleSearch}
				value={filters.search}
				placeholder='Search name or email...'
			/>

			{isLoading && <TableSkeleton rows={5} />}

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{users && (
				<CustomTable
					data={users.data}
					columns={columns}
					enableSorting
					sortingMode='server'
					enablePagination
					paginationMode='server'
					pageSize={filters.limit}
					currentPage={filters.page}
					totalCount={users.totalCount}
					onPaginationChange={handlePaginationChange}
					emptyState={
						<EmptyMessage
							message={filters.search ? 'No users found' : 'No users yet'}
							description={
								filters.search
									? 'Try a different search term.'
									: 'Add users to allow them to sign in to the system.'
							}
							icon={<Users className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			)}

			<CreateUpdateUserDialog
				open={formOpen}
				onClose={handleFormClose}
				user={editingUser}
			/>

			<CustomAlertDialog
				isOpen={!!userToDelete}
				onClose={() => setUserToDelete(null)}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
				title='Delete user?'
				description={
					userToDelete
						? `This will permanently remove ${userToDelete.name} (${userToDelete.email}) from the system.`
						: undefined
				}
				cancelText='Cancel'
				confirmText='Delete'
			/>
		</div>
	);
};

export default UsersComponent;
