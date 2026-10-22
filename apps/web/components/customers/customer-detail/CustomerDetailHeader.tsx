import type { GetCustomerDetailResponseType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { ArrowLeftIcon, PackageIcon } from 'lucide-react';
import { useState } from 'react';
import { useRedirect } from '@/hooks/useRedirect';
import { CHANNEL_STYLES } from '../../badge-style-config';
import { EnumBadge } from '../../general/CustomBadge';
import SampleOrderDialog from '../SampleOrderDialog';
import StoreCountInput from './StoreCountInput';

interface CustomerDetailHeaderProps {
	customer: GetCustomerDetailResponseType;
}

const CustomerDetailHeader = ({ customer }: CustomerDetailHeaderProps) => {
	const { goBack } = useRedirect();
	const [sampleOrderOpen, setSampleOrderOpen] = useState(false);
	const name = customer.firstName
		? `${customer.firstName} ${customer.lastName}`.trim()
		: customer.displayName;

	return (
		<div className='flex items-center justify-between'>
			<div className='flex items-center gap-2'>
				<Button variant='ghost' onClick={goBack}>
					<ArrowLeftIcon className='size-4' />
				</Button>
				<div className='space-y-1'>
					<h1 className='font-heading text-3xl leading-none'>
						{name}
						{customer.company && (
							<span className='text-xl text-muted-foreground'>
								<span className='mx-2'>•</span>
								{customer.company}
							</span>
						)}
					</h1>
					<div className='flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground'>
						<span>
							Joined{' '}
							{format(new Date(customer.shopifyCreatedAt), 'MMM d, yyyy')}
						</span>
						{customer.saueroCode ? (
							<>
								<span>•</span>
								<span className='font-mono text-foreground'>
									{customer.saueroCode}
								</span>
							</>
						) : null}
						{customer.channels.length > 0 && (
							<>
								<span>•</span>
								{customer.channels.map((channel) => (
									<EnumBadge
										key={channel}
										value={channel}
										className={cn(CHANNEL_STYLES[channel])}
										allCaps
									/>
								))}
							</>
						)}
					</div>
				</div>
			</div>
			<div className='flex items-center gap-3'>
				{customer.storeCount != null && (
					<StoreCountInput
						customerId={customer.id}
						storeCount={customer.storeCount}
					/>
				)}
				<Button onClick={() => setSampleOrderOpen(true)} size='sm'>
					<PackageIcon className='size-4' />
					Send sample order
				</Button>
			</div>
			<SampleOrderDialog
				customers={[
					{ id: customer.id, name, defaultAddress: customer.defaultAddress },
				]}
				open={sampleOrderOpen}
				onClose={() => setSampleOrderOpen(false)}
			/>
		</div>
	);
};

export default CustomerDetailHeader;
