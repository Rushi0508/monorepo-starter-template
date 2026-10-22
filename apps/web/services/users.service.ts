import type {
	CreateUserInput,
	GetUsersResponseType,
	UserFilterType,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class UsersService {
	static async list(filters: UserFilterType) {
		return ApiClient.get<GetUsersResponseType>('/api/users', filters);
	}

	static async create(input: CreateUserInput) {
		return ApiClient.post<{ message: string }>('/api/users', input);
	}

	static async update(id: string, data: Partial<CreateUserInput>) {
		return ApiClient.patch<{ message: string }>(`/api/users/${id}`, data);
	}

	static async delete(id: string) {
		return ApiClient.delete<{ message: string }>(`/api/users/${id}`);
	}
}
