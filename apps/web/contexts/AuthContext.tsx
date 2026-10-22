'use client';

import type { AuthContextType } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { createContext, use, useEffect } from 'react';
import GlobalLoading from '@/app/loading';
import { useRedirect } from '@/hooks/useRedirect';
import { useSession } from '@/lib/auth-client';
import { AuthService } from '@/services';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const { data: session, isPending } = useSession();
	const { handleLogout } = useRedirect();
	const userId = session?.session.userId;

	const { data: user, error } = useQuery({
		queryKey: ['auth', 'me', userId],
		queryFn: AuthService.me,
		enabled: Boolean(userId),
		retry: false,
	});

	useEffect(() => {
		if (error) handleLogout(error.message);
	}, [error, handleLogout]);

	if (isPending || !user) {
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
