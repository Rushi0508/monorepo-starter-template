import type { AuthContextType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class AuthService {
	static async me() {
		return await ApiClient.get<AuthContextType>('/api/users/me');
	}
}
