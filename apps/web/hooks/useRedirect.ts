import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { signOut } from '@/lib/auth-client';

export const useRedirect = () => {
	const router = useRouter();

	const handleLogout = useCallback(
		async (error?: string) => {
			await signOut();
			const query = error ? `?error=${encodeURIComponent(error)}` : '';
			router.replace(`/login${query}`);
			router.refresh();
		},
		[router]
	);

	const goBack = useCallback(() => router.back(), [router]);

	return { handleLogout, goBack };
};
