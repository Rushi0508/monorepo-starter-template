'use client';

import { Button } from '@repo/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import LoadingButton from '@/components/general/LoadingButton';
import { envConfig } from '@/env-config';
import { getSession } from '@/lib/auth-client';

export default function ConsentPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);

	const consentCode = searchParams.get('consent_code') ?? '';
	const clientId = searchParams.get('client_id') ?? 'MCP client';
	const scope = searchParams.get('scope') ?? '';
	const scopes = useMemo(
		() =>
			scope
				.split(' ')
				.map((s) => s.trim())
				.filter(Boolean),
		[scope]
	);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const session = await getSession();
			if (cancelled) return;
			if (!session.data) {
				const returnTo = `/consent?${searchParams.toString()}`;
				router.replace(`/login?callbackURL=${encodeURIComponent(returnTo)}`);
				return;
			}
			setCheckingSession(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [router, searchParams]);

	const submitConsent = async (accept: boolean) => {
		if (!consentCode) {
			toast.error('Missing consent code. Restart the MCP connection.');
			return;
		}
		setIsLoading(true);
		try {
			const response = await fetch(
				`${envConfig.betterAuthUrl}/api/auth/oauth2/consent`,
				{
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						accept,
						consent_code: consentCode,
					}),
				}
			);
			const data = (await response.json().catch(() => null)) as {
				redirectURI?: string;
				message?: string;
				error?: string;
			} | null;

			if (!response.ok) {
				toast.error(
					data?.message ?? data?.error ?? 'Failed to submit consent',
					{ duration: 10000 }
				);
				return;
			}

			if (data?.redirectURI) {
				window.location.href = data.redirectURI;
				return;
			}

			toast.success(accept ? 'Access granted' : 'Access denied');
			router.replace('/');
		} catch {
			toast.error('Failed to submit consent. Try again.', { duration: 10000 });
		} finally {
			setIsLoading(false);
		}
	};

	if (checkingSession) {
		return (
			<Card className='w-full max-w-lg border-none bg-transparent shadow-none'>
				<CardContent className='py-10 text-center text-sm text-muted-foreground'>
					Checking session…
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='w-full max-w-lg border-none bg-transparent shadow-none'>
			<CardHeader className='space-y-4 text-center'>
				<div className='mx-auto flex items-center justify-center'>
					<Image
						src='/images/logo.png'
						alt='Sauero'
						width={48}
						height={48}
						priority
					/>
				</div>
				<CardTitle className='font-heading text-3xl font-normal'>
					Allow MCP access
				</CardTitle>
				<CardDescription>
					<strong className='text-foreground'>{clientId}</strong> wants to
					access your Sauero data through MCP.
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-6'>
				{scopes.length > 0 && (
					<div className='rounded-lg border bg-background/60 p-4 text-left'>
						<p className='mb-2 text-sm font-medium'>Requested permissions</p>
						<ul className='list-inside list-disc space-y-1 text-sm text-muted-foreground'>
							{scopes.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>
				)}
				<div className='flex flex-col gap-3 sm:flex-row'>
					<Button
						type='button'
						variant='outline'
						className='flex-1'
						disabled={isLoading}
						onClick={() => void submitConsent(false)}
					>
						Deny
					</Button>
					<LoadingButton
						type='button'
						className='flex-1'
						isLoading={isLoading}
						onClick={() => void submitConsent(true)}
					>
						Allow
					</LoadingButton>
				</div>
			</CardContent>
		</Card>
	);
}
