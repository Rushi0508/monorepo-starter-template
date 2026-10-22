'use client';
import { Button } from '@repo/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import Link from 'next/link';

const Unauthorized = () => {
	return (
		<div className='bg-background flex min-h-screen items-center justify-center p-4 w-full'>
			<Card className='w-full max-w-md text-center'>
				<CardHeader>
					<CardTitle className='flex items-center justify-center text-3xl'>
						<ShieldX className='text-destructive mr-3 h-12 w-12' />
						Not Authorized
					</CardTitle>
					<CardDescription className='text-base'>
						You don&apos;t have permission to access this page.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='border-destructive/20 bg-muted/10 rounded-lg border border-dashed p-6'>
						<p className='text-muted-foreground'>
							If you believe this is a mistake, please contact your
							administrator to request the necessary permissions.
						</p>
					</div>
					<div className='flex flex-col space-y-4'>
						<Button asChild className='w-full'>
							<Link href='/'>
								<Home className='mr-2 h-4 w-4' />
								Return to Home
							</Link>
						</Button>
						<Button
							variant='outline'
							className='w-full'
							onClick={() => globalThis.history.back()}
						>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Go Back
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Unauthorized;
