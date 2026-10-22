import type { SkuChannelPresence } from '@repo/types';
import Image from 'next/image';

export const CHANNEL_ICONS = [
	{ key: 'shopify' as const, label: 'Shopify', src: '/images/shopify.webp' },
	{
		key: 'bluebox' as const,
		label: 'BlueBox (iDrive)',
		src: '/images/bluebox.webp',
	},
	{
		key: 'simplydepo' as const,
		label: 'SimplyDepo',
		src: '/images/simplydepo.webp',
	},
];

/**
 * The pinned first-column cell: product title, SKU code, and a channel-presence
 * strip. Every channel is always rendered — a greyed-out logo communicates what
 * the SKU is still missing, which a hidden icon can't.
 */
export const SkuCell = ({
	title,
	sku,
	channels,
}: {
	title?: string | null;
	sku: string;
	channels?: SkuChannelPresence;
}) => (
	<div className='flex h-full flex-col justify-center gap-1 overflow-hidden leading-none'>
		<span className='truncate text-[13px] font-medium'>{title || sku}</span>
		<span className='truncate text-[11px] text-muted-foreground'>{sku}</span>
		<div className='flex items-center gap-1'>
			{CHANNEL_ICONS.map((ch) => {
				const present = Boolean(channels?.[ch.key]);
				const tooltip = present ? `In ${ch.label}` : `Not in ${ch.label}`;
				return (
					<span
						key={ch.key}
						title={tooltip}
						className={`inline-flex ${present ? '' : 'opacity-30 grayscale'}`}
					>
						<Image
							src={ch.src}
							alt={tooltip}
							width={1000}
							height={1000}
							className='size-3.5'
							draggable={false}
							loading='eager'
						/>
					</span>
				);
			})}
		</div>
	</div>
);
