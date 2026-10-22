'use client';

import type { AuthContextType } from '@repo/types';
import { createContext, use, useCallback, useEffect, useState } from 'react';
import GlobalLoading from '@/app/loading';
import { useRedirect } from '@/hooks/useRedirect';
import { useSession } from '@/lib/auth-client';
import { AuthService } from '@/services';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<AuthContextType | null>(null);
	const { data, isPending } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const { handleLogout } = useRedirect();

	const fetchUser = useCallback(async () => {
		try {
			setIsLoading(true);
			const resp = await AuthService.me();
			setUser(resp);
		} catch (error) {
			console.log((error as Error).message);
			handleLogout(error instanceof Error ? error.message : undefined);
		} finally {
			setIsLoading(false);
		}
	}, [handleLogout]);

	useEffect(() => {
		if (data?.session.userId) {
			fetchUser();
		}
	}, [data?.session.userId, fetchUser]);

	if (isPending || isLoading || !user) {
		return <GlobalLoading />;
	}

	return <AuthContext value={user}>{children}</AuthContext>;
};

export const useAuth = () => {
	const context = use(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
