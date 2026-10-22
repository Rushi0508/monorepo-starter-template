import type { UserFilterType } from '@repo/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { UsersService } from '@/services';

export const usersQueryKeys = {
	all: ['users'] as const,
	list: (filters: UserFilterType) =>
		[...usersQueryKeys.all, 'list', filters] as const,
};

export function useUsers(filters: UserFilterType) {
	return useQuery({
		queryKey: usersQueryKeys.list(filters),
		queryFn: () => UsersService.list(filters),
		placeholderData: keepPreviousData,
	});
}
