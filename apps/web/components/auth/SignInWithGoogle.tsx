'use client';

import { Button } from '@repo/ui/components/button';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { toAbsoluteAuthCallbackUrl } from '@/lib/auth-callback-url';
import { signIn } from '@/lib/auth-client';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	User_is_not_added_in_the_system: 'User is not added in the system.',
	user_is_not_added_in_the_system: 'User is not added in the system.',
	UNAUTHORIZED: 'User is not added in the system.',
	google_signin: 'Failed to sign in with Google',
	access_denied: 'Failed to sign in with Google',
};

const getAuthErrorToastMessage = (message: string): string => {
	const decoded = decodeURIComponent(message.replace(/\+/g, ' '));

	if (AUTH_ERROR_MESSAGES[decoded]) {
		return AUTH_ERROR_MESSAGES[decoded];
	}

	if (decoded.includes('_') && !decoded.includes(' ')) {
		const sentence = decoded.replace(/_/g, ' ');
		return sentence.endsWith('.') ? sentence : `${sentence}.`;
	}

	return decoded;
};

type SignInWithGoogleProps = {
	callbackUrl?: string;
	disabled?: boolean;
	onLoadingChange?: (loading: boolean) => void;
};

const SignInWithGoogle = ({
	callbackUrl = '/',
	disabled = false,
	onLoadingChange,
}: SignInWithGoogleProps) => {
	const [loading, setLoading] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const error =
			searchParams.get('error_description') ?? searchParams.get('error');
		if (!error) return;

		toast.error(getAuthErrorToastMessage(error), { duration: 10000 });

		const nextParams = new URLSearchParams(searchParams.toString());
		nextParams.delete('error');
		nextParams.delete('error_description');
		const query = nextParams.toString();
		router.replace(query ? `/login?${query}` : '/login');
	}, [router, searchParams]);

	const handleGoogleSignIn = async () => {
		try {
			setLoading(true);
			onLoadingChange?.(true);

			const { error } = await signIn.social({
				provider: 'google',
				callbackURL: toAbsoluteAuthCallbackUrl(callbackUrl),
			});

			if (error) {
				toast.error(error.message ?? 'Failed to sign in with Google.', {
					duration: 10000,
				});
			}
		} catch {
			toast.error('An unexpected error occurred', { duration: 10000 });
		} finally {
			setLoading(false);
			onLoadingChange?.(false);
		}
	};

	return (
		<Button
			type='button'
			variant='outline'
			disabled={disabled || loading}
			onClick={handleGoogleSignIn}
			className='w-full'
		>
			{loading ? (
				<Loader2 className='mr-2 size-4 animate-spin' />
			) : (
				<GoogleIcon className='mr-2 size-4' />
			)}
			Continue with Google
		</Button>
	);
};

export default SignInWithGoogle;
