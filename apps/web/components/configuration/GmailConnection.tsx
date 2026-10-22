import { tooltips } from '@repo/constants';
import { Button } from '@repo/ui/components/button';
import { format } from 'date-fns';
import { Link2Off } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import CustomTooltip from '@/components/general/CustomTooltip';
import LoadingButton from '@/components/general/LoadingButton';
import GmailIcon from '@/components/icons/GmailIcon';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useDisconnectGmail, useGmailStatus } from '@/queries';
import { GmailService } from '@/services';
import AlertMessage from '../general/AlertMessage';
import { SkletonLoader } from '../general/SkletonLoader';

const GmailConnection = () => {
	const { data, isLoading, error, refetch } = useGmailStatus();
	const disconnect = useDisconnectGmail();
	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const gmail = searchParams.get('gmail');
		if (!gmail) return;

		if (gmail === 'connected') {
			toast.success('Gmail connected');
			refetch();
		} else if (gmail === 'error') {
			const reason = searchParams.get('reason') ?? 'Connection failed';
			toast.error(decodeURIComponent(reason), { duration: 10000 });
		}

		router.replace('/configuration');
	}, [searchParams, router, refetch]);

	const handleConnect = async () => {
		try {
			const { url } = await GmailService.connect();
			window.location.href = url;
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to start Google connect'
			);
		}
	};

	if (isLoading) {
		return <SkletonLoader count={2} className='h-10' />;
	}

	if (error) {
		return <AlertMessage message={error.message} />;
	}

	return (
		<div className='flex h-22 items-center rounded-lg border bg-card px-4'>
			<div className='flex w-full justify-between items-center'>
				<div className='flex min-w-0 items-center gap-3'>
					<div className='flex size-10 shrink-0 items-center justify-center rounded-md border bg-background'>
						<GmailIcon className='size-6' />
					</div>
					<div className='min-w-0'>
						<div className='flex items-center gap-1.5'>
							<h2 className='text-sm font-semibold'>Gmail connection</h2>
							<CustomTooltip
								content={tooltips.configurationPage.gmailConnection}
							/>
						</div>
						{isLoading ? (
							<p className='mt-1 truncate text-sm text-muted-foreground'>
								Checking connection…
							</p>
						) : data?.connected ? (
							<p className='mt-1 truncate text-sm'>
								Connected as <span className='font-medium'>{data.email}</span>
							</p>
						) : (
							<p className='mt-1 truncate text-sm text-muted-foreground'>
								No Google account connected. Connect an inbox so Sauero can read
								and send emails.
							</p>
						)}
					</div>
				</div>

				<div className='space-y-1'>
					<div className='flex flex-wrap items-center gap-2'>
						{data?.connected ? (
							<>
								<Button type='button' variant='outline' onClick={handleConnect}>
									<GoogleIcon className='size-4' />
									Change account
								</Button>
								<LoadingButton
									type='button'
									variant='outline'
									isLoading={disconnect.isPending}
									onClick={() => disconnect.mutate()}
								>
									<Link2Off className='size-4' />
									Disconnect
								</LoadingButton>
							</>
						) : (
							<Button
								type='button'
								onClick={handleConnect}
								disabled={isLoading}
							>
								<GoogleIcon className='size-4' />
								Connect Google
							</Button>
						)}
					</div>
					{data?.connected && data.connectedAt && (
						<p className='text-sm text-muted-foreground text-right'>
							{`Since ${format(new Date(data.connectedAt), 'MMM d, yyyy')}`}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default GmailConnection;
