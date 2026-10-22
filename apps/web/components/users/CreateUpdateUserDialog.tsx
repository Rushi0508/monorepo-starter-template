'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema } from '@repo/schemas';
import type { CreateUserInput, UserListItem } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { useCreateUser, useUpdateUser } from '@/queries';

type CreateUpdateUserDialogProps = Readonly<{
	open: boolean;
	onClose: () => void;
	user?: UserListItem | null;
}>;

export function CreateUpdateUserDialog({
	open,
	onClose,
	user,
}: CreateUpdateUserDialogProps) {
	const { mutate: createUser, isPending: isCreating } = useCreateUser();
	const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
	const isPending = isCreating || isUpdating;

	const getDefaultValues = useCallback(
		(user?: UserListItem | null): CreateUserInput => {
			return {
				name: user?.name ?? '',
				email: user?.email ?? '',
			};
		},
		[]
	);

	const form = useForm<CreateUserInput>({
		resolver: zodResolver(CreateUserSchema),
		defaultValues: getDefaultValues(),
	});

	useEffect(() => {
		if (open) {
			form.reset(getDefaultValues(user));
		}
	}, [open, user, getDefaultValues, form]);

	const onSubmit = useCallback(
		(data: CreateUserInput) => {
			if (user) {
				updateUser({ id: user.id, data }, { onSuccess: () => onClose() });
			} else {
				createUser(data, { onSuccess: () => onClose() });
			}
		},
		[user, updateUser, createUser, onClose]
	);

	const isEdit = !!user;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Update the user name. Email cannot be changed.'
							: 'Add a new user to the system. They can sign in with their email once added.'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Name
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g. Jane Doe'
											autoComplete='name'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Email
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											type='email'
											placeholder='e.g. jane@example.com'
											autoComplete='email'
											disabled={isEdit}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								{isEdit ? 'Save Changes' : 'Add User'}
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
