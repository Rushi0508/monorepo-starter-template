import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { envConfig } from '@/env-config';

export const {
	useSession,
	signIn,
	signUp,
	signOut,
	getSession,
	sendVerificationEmail,
	emailOtp,
} = createAuthClient({
	baseURL: envConfig.betterAuthUrl,
	basePath: '/api/auth',
	fetchOptions: {
		credentials: 'include' as RequestCredentials,
	},
	plugins: [emailOTPClient()],
});
