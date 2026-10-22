import type { GetUsersResponseType, UserFilterType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class UsersService {
	static list(filters: UserFilterType) {
		return ApiClient.get<GetUsersResponseType>('/api/users', filters);
	}
}
