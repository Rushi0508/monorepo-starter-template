import type { AuthContextType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class AuthService {
	static me() {
		return ApiClient.get<AuthContextType>('/api/users/me');
	}
}
