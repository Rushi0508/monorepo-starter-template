import type { GetCustomerDetailResponseType } from '@repo/types';
import { Separator } from '@repo/ui/components/separator';
import { ExternalLink, Tag } from 'lucide-react';
import { shopifyCustomerUrl } from '@/utils/get-urls';

interface RecentSkusCardProps {
	customer: GetCustomerDetailResponseType;
}

const RecentSkusCard = ({ customer }: RecentSkusCardProps) => (
	<div className='rounded-xl border bg-card p-5 space-y-4'>
		<p className='flex items-center gap-2 text-sm font-semibold'>
			<Tag className='size-3.5' />
			Recent SKUs
		</p>
		<div className='space-y-2'>
			{customer.recentSkus.length > 0 ? (
				customer.recentSkus.map((sku) => (
					<div
						key={sku}
						className='rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium'
					>
						{sku}
					</div>
				))
			) : (
				<p className='text-sm text-muted-foreground'>No recent SKUs</p>
			)}
		</div>
		<Separator />
		<a
			href={shopifyCustomerUrl(customer.shopifyId)}
			target='_blank'
			rel='noopener noreferrer'
			className='flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
		>
			<ExternalLink className='size-3.5' />
			Open in Shopify
		</a>
	</div>
);

export default RecentSkusCard;
