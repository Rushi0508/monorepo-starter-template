'use client';

import { tooltips } from '@repo/constants';
import { BlueboxWorkflowStatusEnum } from '@repo/enums';
import type { ReplenishmenOrdersResponseType } from '@repo/types';
import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { ExternalLink, InfoIcon } from 'lucide-react';
import { BLUEBOX_WORKFLOW_STATUS_STYLES } from '@/components/badge-style-config';
import { EnumBadge } from '@/components/general/CustomBadge';
import CustomTooltip from '@/components/general/CustomTooltip';
import { OverflowList } from '@/components/OverflowList';
import { useGmailStatus } from '@/queries';
import { blueboxOrderUrl, gmailThreadUrl } from '@/utils/get-urls';

interface ReplenishmentOrdersTableProps {
	data: ReplenishmenOrdersResponseType;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const dataFlowStatus = (
	order: ReplenishmenOrdersResponseType[number]
): { label: string; variant: BadgeVariant; title: string } => {
	if (!order.isProcessed) {
		return {
			label: 'Pending',
			variant: 'secondary',
			title:
				'Waiting on BlueBox to deliver, or the SKU update is not done in Shopify yet.',
		};
	}
	if (order.isBlueboxCancelled) {
		return {
			label: 'Skipped',
			variant: 'outline',
			title: 'Order was cancelled in BlueBox — no inventory was synced.',
		};
	}
	return {
		label: 'Synced',
		variant: 'default',
		title: 'Shopify inventory was adjusted for the Manuel Brothers location.',
	};
};

/** "Yes" badge that links to the related email when one is known. */
const emailStatusBadge = (
	at: Date | string | null | undefined,
	yesTitle: string,
	link: { href: string; label: string } | null
) => {
	if (!at) {
		return <span className='text-muted-foreground'>—</span>;
	}
	const title = `${yesTitle}: ${format(new Date(at), 'MMM d, yyyy h:mm a')}`;
	if (!link) {
		return (
			<Badge variant='default' title={title}>
				Yes
			</Badge>
		);
	}
	return (
		<Badge asChild variant='default' title={`${title} — ${link.label}`}>
			<a href={link.href} target='_blank' rel='noopener noreferrer'>
				Yes <ExternalLink />
			</a>
		</Badge>
	);
};

export const ReplenishmentOrdersTable = ({
	data,
}: ReplenishmentOrdersTableProps) => {
	const { data: gmailStatus } = useGmailStatus();
	const gmailAccount = gmailStatus?.email ?? null;

	return (
		<table className='w-full text-sm'>
			<thead>
				<tr className='border-b bg-muted'>
					<th className='px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground'>
						ORDER #
					</th>
					<th className='px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground'>
						ITEMS
					</th>
					<th className='px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground'>
						<span className='inline-flex items-center gap-1'>
							DATA FLOW STATUS
							<CustomTooltip
								content={tooltips.replenishmentOrders.dataFlowStatus}
								className='whitespace-pre-line font-normal normal-case tracking-normal'
							/>
						</span>
					</th>
					<th className='px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground'>
						BLUE BOX STATUS
					</th>
					<th className='px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground'>
						EMAIL SENT
					</th>
					<th className='px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground'>
						EMAIL ACK
					</th>
					<th className='px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted-foreground'>
						PICKED UP
					</th>
					<th className='px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground'>
						PICKUP DATE
					</th>
					<th className='px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground'>
						CREATED
					</th>
				</tr>
			</thead>
			<tbody>
				{data.map((order, i) => {
					const blueboxUrl = order.blueboxOrderId
						? blueboxOrderUrl(order.blueboxOrderId)
						: null;
					const emailLink = order.gmailThreadId
						? {
								href: gmailThreadUrl(order.gmailThreadId, gmailAccount),
								label: 'open in Gmail',
							}
						: null;
					const pickupLink = order.pickupEmailId
						? {
								href: `/inbound-emails?tab=pickup&emailId=${order.pickupEmailId}`,
								label: 'view pickup email',
							}
						: null;
					const dataFlow = dataFlowStatus(order);
					const blueboxBadge = order.blueboxStatus ? (
						<EnumBadge
							value={order.blueboxStatus as BlueboxWorkflowStatusEnum}
							allCaps
							icon={blueboxUrl ? <ExternalLink /> : undefined}
							iconPosition='right'
							className={cn(
								BLUEBOX_WORKFLOW_STATUS_STYLES[
									order.blueboxStatus as BlueboxWorkflowStatusEnum
								]
							)}
						/>
					) : null;
					return (
						<tr
							key={order.id}
							className={cn(
								'border-b last:border-b-0',
								i % 2 === 1 ? 'bg-muted/10' : ''
							)}
						>
							<td className='px-4 py-2.5 font-medium'>{order.orderNumber}</td>
							<td className='px-4 py-2.5 text-muted-foreground'>
								<OverflowList
									visibleCount={1}
									items={order.items.map((it) => `${it.sku} x ${it.quantity}`)}
								/>
							</td>
							<td className='px-4 py-2.5 text-center'>
								<span className='inline-flex items-center gap-1'>
									<Badge variant={dataFlow.variant} title={dataFlow.title}>
										{dataFlow.label}
									</Badge>
									{!order.isProcessed && order.dataFlowError && (
										<CustomTooltip
											content={order.dataFlowError}
											className='max-w-sm'
										>
											<InfoIcon className='size-3.5 text-destructive' />
										</CustomTooltip>
									)}
								</span>
							</td>
							<td className='px-4 py-2.5 text-center'>
								{blueboxBadge && blueboxUrl ? (
									<a
										href={blueboxUrl}
										target='_blank'
										rel='noopener noreferrer'
										title='Open in BlueBox'
										className='inline-flex hover:opacity-80'
									>
										{blueboxBadge}
									</a>
								) : (
									(blueboxBadge ?? (
										<span
											className='text-muted-foreground'
											title='No matching BlueBox order has synced yet.'
										>
											—
										</span>
									))
								)}
							</td>
							<td className='px-4 py-2.5 text-center'>
								{emailStatusBadge(order.emailSentAt, 'Email sent', emailLink)}
							</td>
							<td className='px-4 py-2.5 text-center'>
								{emailStatusBadge(
									order.emailAcknowledgedAt,
									'Email acknowledged',
									emailLink
								)}
							</td>
							<td className='px-4 py-2.5 text-center'>
								{emailStatusBadge(
									order.pickupConfirmedAt,
									'Bill of Lading received',
									pickupLink
								)}
							</td>
							<td className='px-4 py-2.5 text-muted-foreground'>
								{order.pickupDate ? (
									<span title='Pallet ready Monday morning at iDrive/CFD for MB pickup'>
										{format(new Date(order.pickupDate), 'EEE, MMM d, yyyy')}
									</span>
								) : (
									<span className='text-muted-foreground'>—</span>
								)}
							</td>
							<td className='px-4 py-2.5 text-muted-foreground'>
								{format(new Date(order.createdAt), 'MMM d, yyyy')}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};
