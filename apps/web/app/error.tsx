'use client';

import { Button } from '@repo/ui/components/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@repo/ui/components/empty';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type ErrorPageProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	return (
		<div className='flex min-h-dvh items-center justify-center p-4'>
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<AlertTriangle />
					</EmptyMedia>
					<EmptyTitle>Something went wrong</EmptyTitle>
					<EmptyDescription>
						{error.message || 'An unknown error occurred.'}
						{error.digest && ` (Error ID: ${error.digest})`}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent className='flex-row justify-center'>
					<Button variant='outline' onClick={reset}>
						<RefreshCw />
						Try again
					</Button>
					<Button render={<Link href='/' />} nativeButton={false}>
						Go home
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
}
