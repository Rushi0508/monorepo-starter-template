'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui/components/table';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUsers } from '@/queries';

const PAGE_SIZE = 10;

export function UsersTable() {
	const currentUser = useAuth();
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const debouncedSearch = useDebouncedValue(search, 300);

	const { data, isPending, isError, error } = useUsers({
		search: debouncedSearch,
		page,
		limit: PAGE_SIZE,
	});

	const totalPages = data
		? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
		: 1;

	return (
		<div className='flex flex-col gap-4'>
			<Input
				placeholder='Search by name or email'
				value={search}
				onChange={(event) => {
					setSearch(event.target.value);
					setPage(1);
				}}
				className='max-w-sm'
			/>
			<div className='rounded-lg border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead className='text-right'>Joined</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isPending &&
							Array.from({ length: 3 }, (_, index) => (
								<TableRow key={index}>
									<TableCell colSpan={3}>
										<Skeleton className='h-5 w-full' />
									</TableCell>
								</TableRow>
							))}
						{isError && (
							<TableRow>
								<TableCell colSpan={3} className='text-destructive text-center'>
									{error.message}
								</TableCell>
							</TableRow>
						)}
						{data?.data.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={3}
									className='text-muted-foreground h-24 text-center'
								>
									No users found.
								</TableCell>
							</TableRow>
						)}
						{data?.data.map((user) => (
							<TableRow key={user.id}>
								<TableCell className='font-medium'>
									{user.name}
									{user.id === currentUser.id && (
										<Badge variant='secondary' className='ml-2'>
											You
										</Badge>
									)}
								</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell className='text-right'>
									{new Date(user.createdAt).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className='flex items-center justify-end gap-2 text-sm'>
				<span className='text-muted-foreground'>
					Page {page} of {totalPages}
				</span>
				<Button
					variant='outline'
					size='sm'
					disabled={page <= 1}
					onClick={() => setPage((current) => current - 1)}
				>
					Previous
				</Button>
				<Button
					variant='outline'
					size='sm'
					disabled={page >= totalPages}
					onClick={() => setPage((current) => current + 1)}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
