import type { CreateUserInput, UserFilterType } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UsersService } from '@/services';

const usersQueryKeys = {
	all: ['users'] as const,
	list: (filters: UserFilterType) =>
		[...usersQueryKeys.all, 'list', filters] as const,
};

export function useUsers(filters: UserFilterType) {
	return useQuery({
		queryKey: usersQueryKeys.list(filters),
		queryFn: () => UsersService.list(filters),
		refetchOnMount: 'always',
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateUserInput) => UsersService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
			toast.success('User created successfully');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<CreateUserInput>;
		}) => UsersService.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
			toast.success('User updated successfully');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => UsersService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
			toast.success('User deleted successfully');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
