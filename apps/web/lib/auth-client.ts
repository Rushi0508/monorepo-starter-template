import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { envConfig } from '@/env-config';

export const { useSession, signIn, signOut, getSession, emailOtp } =
	createAuthClient({
		baseURL: envConfig.apiUrl,
		basePath: '/api/auth',
		fetchOptions: {
			credentials: 'include',
		},
		plugins: [emailOTPClient()],
	});
