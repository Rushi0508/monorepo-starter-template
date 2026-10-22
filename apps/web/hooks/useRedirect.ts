import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { envConfig } from '@/env-config';
import { signOut } from '@/lib/auth-client';

export const useRedirect = () => {
	const router = useRouter();

	const redirect = (path: string) => {
		router.push(path);
	};

	const handleLogout = useCallback(async (error?: string) => {
		await signOut();
		if (error) {
			globalThis.location.href = `${envConfig.appUrl}/login?error=${error}`;
		} else {
			globalThis.location.reload();
		}
	}, []);

	const goBack = useCallback(() => {
		router.back();
	}, [router]);

	return {
		redirect,
		handleLogout,
		goBack,
	};
};
