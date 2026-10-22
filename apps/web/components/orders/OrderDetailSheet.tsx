'use client';

import { tooltips } from '@repo/constants';
import {
	BlueboxWorkflowStatusEnum,
	ChannelEnum,
	FulfillmentStatusEnum,
	PaymentStatusEnum,
	ShipmentStatusEnum,
} from '@repo/enums/dist';
import type {
	OrderFulfillment,
	OrderItem,
	OrderLineItem,
	OrderMargin,
} from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Separator } from '@repo/ui/components/separator';
import { Sheet, SheetContent, SheetTitle } from '@repo/ui/components/sheet';
import { cn } from '@repo/ui/lib/utils';
import { isBlueboxEligibleChannel } from '@repo/utils';
import { formatCurrency } from '@repo/utils/string.utils';
import { format } from 'date-fns';
import {
	CreditCard,
	ExternalLink,
	FileText,
	Mail,
	MapPin,
	Package,
	TrendingUp,
	Truck,
	XCircle,
} from 'lucide-react';
import Link from 'next/link';
import CustomTooltip from '@/components/general/CustomTooltip';
import { useGmailStatus } from '@/queries';
import {
	blueboxOrderUrl,
	gmailThreadUrl,
	shopifyOrderUrl,
} from '@/utils/get-urls';
import {
	BLUEBOX_WORKFLOW_STATUS_STYLES,
	CHANNEL_STYLES,
	DANGER_STYLE,
	FULFILLMENT_STYLES,
	PAYMENT_STYLES,
	SHIPMENT_STATUS_STYLES,
} from '../badge-style-config';
import { EnumBadge } from '../general/CustomBadge';

const FinancialRow = ({
	label,
	value,
	bold,
	strong,
	negative,
	muted,
}: {
	label: string;
	value: string;
	bold?: boolean;
	/** Bolder at the regular row size, for a bottom line that isn't a total */
	strong?: boolean;
	negative?: boolean;
	muted?: boolean;
}) => (
	<div className='flex items-center justify-between py-1'>
		<span
			className={
				bold
					? 'font-semibold'
					: muted
						? 'text-sm text-muted-foreground'
						: cn('text-sm', strong && 'font-semibold')
			}
		>
			{label}
		</span>
		<span
			className={`tabular-nums ${bold ? 'font-bold text-base' : 'text-sm'} ${strong ? 'font-semibold' : ''} ${negative ? 'text-emerald-600' : ''} ${muted ? 'text-muted-foreground' : ''}`}
		>
			{value}
		</span>
	</div>
);

// ─── line items table ──────────────────────────────────────────────────────────

const LineItemsTable = ({ items }: { items: OrderLineItem[] }) => (
	<table className='w-full text-sm'>
		<thead>
			<tr className='border-b'>
				{['PRODUCT', 'CASE PRICE', 'QTY', 'DISCOUNT'].map((h) => (
					<th
						key={h}
						className='pb-2 text-left text-xs font-semibold tracking-wide text-muted-foreground last:text-right'
					>
						{h}
					</th>
				))}
			</tr>
		</thead>
		<tbody>
			{items.map((item) => {
				const isInActive =
					item.currentQuantity !== null && item.currentQuantity === 0;
				const totalItemDiscount = item?.discountAllocations?.reduce(
					(acc, curr) =>
						acc + parseFloat(curr.allocatedAmountSet.shopMoney.amount),
					0
				);
				return (
					<tr key={item.id} className='border-b last:border-0'>
						<td className='py-2.5 pr-4'>
							<p
								className={cn(
									'font-medium leading-tight',
									isInActive ? 'line-through' : ''
								)}
							>
								{item.title ?? '—'}
							</p>
							{(item.sku || item.variantTitle) && (
								<p className='text-xs text-muted-foreground mt-0.5'>
									{[item.sku, item.variantTitle].filter(Boolean).join(' · ')}
								</p>
							)}
						</td>
						<td className='py-2.5 pr-4 tabular-nums'>
							{item.price != null ? formatCurrency(item.price) : '—'}
						</td>
						<td className='py-2.5 pr-4 font-medium'>{item.quantity}</td>
						<td className='py-2.5 text-right tabular-nums'>
							{totalItemDiscount != null && totalItemDiscount > 0 ? (
								<span className='text-emerald-600'>
									-{formatCurrency(totalItemDiscount)}
								</span>
							) : (
								<span className='text-muted-foreground'>—</span>
							)}
						</td>
					</tr>
				);
			})}
		</tbody>
	</table>
);

// ─── profit & loss card ────────────────────────────────────────────────────────

const deduction = (amount: number) => `–${formatCurrency(amount)}`;

/** The order's P&L, top line to bottom line, with a subtotal after each step. */
const ProfitAndLossCard = ({ margin }: { margin: OrderMargin }) => (
	<div className='rounded-xl border bg-card p-4 space-y-3'>
		<div className='flex items-center gap-2'>
			<TrendingUp className='size-4 text-muted-foreground' />
			<span className='font-semibold text-sm'>Profit & loss</span>
			<CustomTooltip content={tooltips.ordersPage.margin} />
		</div>

		<Separator />

		<div className='space-y-0.5'>
			<FinancialRow
				label='Gross revenue'
				value={formatCurrency(margin.grossRevenue)}
			/>
			<FinancialRow
				label='Discounts'
				value={deduction(margin.discounts)}
				muted
			/>
			<FinancialRow label='Refunds' value={deduction(margin.refunds)} muted />
			<Separator className='my-1' />
			<FinancialRow
				label='Net revenue'
				value={formatCurrency(margin.netRevenue)}
			/>
			<FinancialRow label='COGS' value={deduction(margin.cogs)} muted />
			<Separator className='my-1' />
			<FinancialRow
				label={`Gross profit (${margin.grossMarginPercentage}% margin)`}
				value={formatCurrency(margin.grossProfit)}
			/>
			<FinancialRow
				label='Fulfillment'
				value={deduction(margin.fulfillmentCost)}
				muted
			/>
			<Separator className='my-1' />
			<FinancialRow
				label={`Contribution profit (${margin.contributionMarginPercentage}% margin)`}
				value={formatCurrency(margin.contributionProfit)}
				strong
			/>
		</div>
	</div>
);

// ─── fulfillment card ──────────────────────────────────────────────────────────

const FulfillmentDateCell = ({
	label,
	value,
	estimated,
}: {
	label: string;
	value: string | null;
	estimated?: string | null;
}) => {
	if (value) {
		const d = new Date(value);
		return (
			<div className='space-y-0.5'>
				<p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
					{label}
				</p>
				<p className='text-sm font-medium tabular-nums'>
					{format(d, 'MMM d, yyyy')}
				</p>
				<p className='text-xs text-muted-foreground tabular-nums'>
					{format(d, 'h:mm a')}
				</p>
			</div>
		);
	}

	if (estimated) {
		const d = new Date(estimated);
		return (
			<div className='space-y-0.5'>
				<p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
					{label}
				</p>
				<p className='text-sm text-muted-foreground italic tabular-nums'>
					{format(d, 'MMM d, yyyy')}
				</p>
				<p className='text-xs text-muted-foreground/70'>Est. delivery</p>
			</div>
		);
	}

	return (
		<div className='space-y-0.5'>
			<p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
				{label}
			</p>
			<p className='text-sm text-muted-foreground'>—</p>
		</div>
	);
};

const FulfillmentCard = ({ order }: { order: OrderItem }) => (
	<div className='rounded-xl border bg-card p-4 space-y-3'>
		<div className='flex items-center gap-2'>
			<Truck className='size-4 text-muted-foreground' />
			<span className='font-semibold text-sm'>Fulfillment details</span>
		</div>

		<div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
			<div className='flex items-center gap-1.5'>
				<span className='text-xs text-muted-foreground'>Shopify</span>
				{order.fulfillmentStatus ? (
					<EnumBadge
						value={order.fulfillmentStatus as FulfillmentStatusEnum}
						className={cn(
							FULFILLMENT_STYLES[
								order.fulfillmentStatus as FulfillmentStatusEnum
							]
						)}
						allCaps
					/>
				) : (
					<span className='text-xs text-muted-foreground'>—</span>
				)}
			</div>
			<div className='flex items-center gap-1.5'>
				<span className='text-xs text-muted-foreground'>BlueBox</span>
				{!isBlueboxEligibleChannel(order.channel as ChannelEnum) ? (
					<span className='text-xs text-muted-foreground'>N/A</span>
				) : order.blueboxWorkflowStatus ? (
					<EnumBadge
						allCaps
						value={order.blueboxWorkflowStatus as BlueboxWorkflowStatusEnum}
						className={cn(
							BLUEBOX_WORKFLOW_STATUS_STYLES[
								order.blueboxWorkflowStatus as BlueboxWorkflowStatusEnum
							]
						)}
					/>
				) : (
					<span className='text-xs text-muted-foreground'>—</span>
				)}
			</div>
		</div>

		<Separator />

		<div className='flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5'>
			<div>
				<p className='text-sm font-medium'>Order shipping cost</p>
				<p className='text-xs text-muted-foreground'>From BlueBox order</p>
			</div>
			<p className='text-sm font-semibold tabular-nums'>
				{order.blueboxShippingCost != null
					? formatCurrency(order.blueboxShippingCost)
					: '—'}
			</p>
		</div>

		<div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
			<FulfillmentDateCell label='Ordered' value={order.date} />
			<FulfillmentDateCell label='Picked' value={order.dateOrderPicked} />
			<FulfillmentDateCell label='Shipped' value={order.dateOrderShipped} />
			<FulfillmentDateCell
				label='Delivery'
				value={order.dateOrderDelivered}
				estimated={order.estimatedDeliveryAt}
			/>
		</div>
	</div>
);

// ─── email automation card ─────────────────────────────────────────────────────

const EmailFlowStep = ({
	label,
	at,
	pendingLabel,
	action,
}: {
	label: string;
	at: string | null;
	pendingLabel: string;
	action?: React.ReactNode;
}) => (
	<div className='flex items-center justify-between gap-3'>
		<div className='space-y-0.5'>
			<p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
				{label}
			</p>
			{at ? (
				<p className='text-sm tabular-nums'>
					{format(new Date(at), 'MMM d, yyyy')}
					<span className='ml-1.5 text-xs text-muted-foreground'>
						{format(new Date(at), 'h:mm a')}
					</span>
				</p>
			) : (
				<p className='text-sm text-muted-foreground'>{pendingLabel}</p>
			)}
		</div>
		{at && action ? <div className='shrink-0'>{action}</div> : null}
	</div>
);

const EmailFlowCard = ({
	emailFlow,
}: {
	emailFlow: OrderItem['emailFlow'];
}) => {
	const { data: gmailStatus } = useGmailStatus();
	const gmailAccount = gmailStatus?.email ?? null;

	const threadUrl = emailFlow?.gmailThreadId
		? gmailThreadUrl(emailFlow?.gmailThreadId, gmailAccount)
		: null;

	return (
		<div className='rounded-xl border bg-card p-4 space-y-3'>
			<div className='flex items-center gap-2'>
				<Mail className='size-4 text-muted-foreground' />
				<span className='font-semibold text-sm'>Email flow</span>
			</div>

			<Separator />

			<div className='space-y-3'>
				<EmailFlowStep
					label='Delivery request'
					at={
						emailFlow?.deliveryRequestSentAt
							? new Date(emailFlow.deliveryRequestSentAt).toISOString()
							: null
					}
					pendingLabel='Not sent'
					action={
						threadUrl && (
							<a
								href={threadUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800'
								title={
									gmailAccount
										? `Open thread in Gmail (${gmailAccount})`
										: 'Open thread in Gmail'
								}
							>
								Gmail <ExternalLink className='size-3' />
							</a>
						)
					}
				/>

				<EmailFlowStep
					label='POD received'
					at={
						emailFlow?.podReceivedAt
							? new Date(emailFlow.podReceivedAt).toISOString()
							: null
					}
					pendingLabel='Awaiting POD'
					action={
						emailFlow?.podEmailId && (
							<Link
								href={`/inbound-emails?tab=pod&emailId=${emailFlow.podEmailId}`}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800'
								title='Open the POD email'
							>
								POD <ExternalLink className='size-3' />
							</Link>
						)
					}
				/>

				<EmailFlowStep
					label='POD processed'
					at={
						emailFlow?.podProcessedAt
							? new Date(emailFlow.podProcessedAt).toISOString()
							: null
					}
					pendingLabel='Not processed yet'
				/>
			</div>
		</div>
	);
};

// ─── tracking card ─────────────────────────────────────────────────────────────

const TrackingCard = ({
	fulfillments,
}: {
	fulfillments: OrderFulfillment[];
}) => {
	if (!fulfillments.length) return null;

	return (
		<div className='rounded-xl border bg-card p-4 space-y-3'>
			<div className='flex items-center gap-2'>
				<Truck className='size-4 text-muted-foreground' />
				<span className='font-semibold text-sm'>Tracking</span>
			</div>

			<div className='space-y-4'>
				{fulfillments.map((f, i) => {
					const urls = f.trackingUrls.length
						? f.trackingUrls
						: f.trackingUrl
							? [f.trackingUrl]
							: [];
					const numbers = f.trackingNumbers.length
						? f.trackingNumbers
						: f.trackingNumber
							? [f.trackingNumber]
							: [];

					return (
						<div key={f.id} className='space-y-2 text-sm'>
							{fulfillments.length > 1 && (
								<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
									Shipment {i + 1}
								</p>
							)}

							{f.trackingCompany && (
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Carrier</span>
									<span className='font-medium'>{f.trackingCompany}</span>
								</div>
							)}

							{numbers.length > 0 && (
								<div className='flex justify-between gap-4'>
									<span className='text-muted-foreground shrink-0'>
										Tracking {numbers.length > 1 ? 'numbers' : 'number'}
									</span>
									<div className='text-right space-y-1'>
										{numbers.map((num, j) => {
											const url = urls[j] ?? urls[0] ?? null;
											return url ? (
												<a
													key={num}
													href={url}
													target='_blank'
													rel='noopener noreferrer'
													className='flex items-center justify-end gap-1 font-mono text-xs font-medium text-foreground hover:underline'
												>
													{num}
													<ExternalLink className='size-3 shrink-0 text-muted-foreground' />
												</a>
											) : (
												<p key={num} className='font-mono text-xs font-medium'>
													{num}
												</p>
											);
										})}
									</div>
								</div>
							)}

							{f.shipmentStatus && (
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Shipment status</span>
									<span className='font-medium capitalize'>
										<EnumBadge
											value={f.shipmentStatus as ShipmentStatusEnum}
											className={cn(
												SHIPMENT_STATUS_STYLES[
													f.shipmentStatus as ShipmentStatusEnum
												]
											)}
											allCaps
										/>
									</span>
								</div>
							)}

							{f.inTransitAt && (
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>In transit at</span>
									<span className='font-medium'>
										{format(new Date(f.inTransitAt), 'MMM d, yyyy')}
									</span>
								</div>
							)}

							{f.estimatedDeliveryAt && (
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Est. delivery</span>
									<span className='font-medium'>
										{format(new Date(f.estimatedDeliveryAt), 'MMM d, yyyy')}
									</span>
								</div>
							)}

							{f.deliveredAt && (
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Delivered</span>
									<span className='font-medium'>
										{format(new Date(f.deliveredAt), 'MMM d, yyyy')}
									</span>
								</div>
							)}

							{i < fulfillments.length - 1 && <Separator />}
						</div>
					);
				})}
			</div>
		</div>
	);
};

// ─── main sheet ────────────────────────────────────────────────────────────────

interface OrderDetailSheetProps {
	order: OrderItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const OrderDetailSheet = ({
	order,
	open,
	onOpenChange,
}: OrderDetailSheetProps) => {
	if (!order) return null;

	const shopifyAdminOrdersUrl = shopifyOrderUrl(order.shopifyId);
	const blueboxUrl = order.blueboxId ? blueboxOrderUrl(order.blueboxId) : null;

	const hasShippingAddress = order.shipAddress1 || order.shipCity;
	const isCancelled = Boolean(order.cancelledAt);

	const subtotal = order.lineItems.reduce(
		(acc, curr) => acc + (curr.price ?? 0) * curr.quantity,
		0
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0'>
				<div className='flex items-center justify-between px-5 py-3 border-b'>
					<div>
						<SheetTitle className='text-xl'>
							Order{' '}
							{order.orderName ? `${order.orderName}` : `#${order.orderNumber}`}
						</SheetTitle>
						<p className='text-xs text-muted-foreground'>
							Detail view · slide drawer
						</p>
					</div>
					<div className='flex items-center gap-2 mr-4'>
						{blueboxUrl && (
							<Button variant='outline' size='sm' asChild>
								<a href={blueboxUrl} target='_blank' rel='noopener noreferrer'>
									<ExternalLink className='size-3.5' />
									Open in Bluebox
								</a>
							</Button>
						)}
						<Button variant='outline' size='sm' asChild>
							<a
								href={shopifyAdminOrdersUrl}
								target='_blank'
								rel='noopener noreferrer'
							>
								<ExternalLink className='size-3.5' />
								Open in Shopify
							</a>
						</Button>
					</div>
				</div>

				{isCancelled && (
					<div
						className={cn(
							'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b',
							DANGER_STYLE
						)}
					>
						<XCircle className='size-4 shrink-0' />
						<span>
							This order was cancelled
							{order.cancelledAt && (
								<> on {format(new Date(order.cancelledAt), 'MMM d, yyyy')}</>
							)}
						</span>
					</div>
				)}

				<div className='flex-1 overflow-y-auto px-5 py-4 space-y-5'>
					{/* ── order header ── */}
					<div className='flex items-start justify-between gap-3'>
						<div className='space-y-1.5'>
							<div className='flex items-center gap-2 flex-wrap'>
								<span className='text-xl font-bold'>
									{order.orderName
										? `${order.orderName}`
										: `#${order.orderNumber}`}
								</span>
								<EnumBadge
									value={order.channel as ChannelEnum}
									className={cn(CHANNEL_STYLES[order.channel as ChannelEnum])}
									allCaps
								/>
								<EnumBadge
									value={order.fulfillmentStatus as FulfillmentStatusEnum}
									className={cn(
										FULFILLMENT_STYLES[
											order.fulfillmentStatus as FulfillmentStatusEnum
										]
									)}
									allCaps
								/>
							</div>
							<p className='text-sm text-muted-foreground'>
								{order.date ? format(new Date(order.date), 'MMM d, yyyy') : '—'}
								{order.customerDisplayName && order.customerId ? (
									<span>
										{' · '}
										<Link
											href={`/customers/${order.customerId}`}
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center gap-0.5 hover:underline text-foreground'
										>
											{order.customerDisplayName}
											<ExternalLink className='size-3 text-muted-foreground' />
										</Link>
									</span>
								) : order.customerDisplayName ? (
									<span> · {order.customerDisplayName}</span>
								) : null}
								{order.shipCompany && <span> · {order.shipCompany}</span>}
							</p>
						</div>
						<div className='text-right shrink-0'>
							<p className='text-2xl font-bold tabular-nums'>
								{order.totalPrice != null
									? formatCurrency(order.totalPrice)
									: '—'}
							</p>
							<p className='text-xs text-muted-foreground'>Order total</p>
						</div>
					</div>

					{/* ── line items card ── */}
					<div className='rounded-xl border bg-card p-4 space-y-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Package className='size-4 text-muted-foreground' />
								<span className='font-semibold text-sm'>Line items</span>
							</div>
						</div>
						<LineItemsTable items={order.lineItems} />

						<Separator />

						{/* financials */}
						<div className='space-y-0.5'>
							<FinancialRow
								label={`Subtotal (${order.lineItems.length} items)`}
								value={formatCurrency(subtotal)}
								muted
							/>
							{order.totalDiscounts != null && order.totalDiscounts > 0 && (
								<FinancialRow
									label='Discounts'
									value={`–${formatCurrency(order.totalDiscounts)}`}
									negative
									muted
								/>
							)}
							<FinancialRow
								label='Shipping (Shopify)'
								value={
									order.totalShippingPrice != null
										? formatCurrency(order.totalShippingPrice)
										: '—'
								}
								muted
							/>
							<FinancialRow
								label='Tax'
								value={
									order.totalTax != null ? formatCurrency(order.totalTax) : '—'
								}
								muted
							/>
							<Separator className='my-1' />
							<FinancialRow
								label='Total'
								value={
									order.totalPrice != null
										? formatCurrency(order.totalPrice)
										: '—'
								}
								bold
							/>
						</div>
					</div>

					{order.margin && <ProfitAndLossCard margin={order.margin} />}

					{order.note && (
						<div className='rounded-xl border bg-card p-4 space-y-2'>
							<div className='flex items-center gap-2'>
								<FileText className='size-4 text-muted-foreground' />
								<span className='font-semibold text-sm'>Order note</span>
							</div>
							<p className='text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap'>
								{order.note}
							</p>
						</div>
					)}

					{order.tags.length > 0 && (
						<div className='flex flex-wrap gap-1.5'>
							{order.tags.map((tag) => (
								<span
									key={tag}
									className='inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground'
								>
									{tag}
								</span>
							))}
						</div>
					)}

					<FulfillmentCard order={order} />

					{order.emailFlow && <EmailFlowCard emailFlow={order.emailFlow} />}

					<TrackingCard fulfillments={order.fulfillments} />

					{/* ── address + payment grid ── */}
					<div className='grid grid-cols-2 gap-3'>
						{/* shipping address */}
						<div className='rounded-xl border bg-card p-4 space-y-2'>
							<div className='flex items-center gap-1.5'>
								<MapPin className='size-3.5 text-muted-foreground' />
								<span className='text-sm font-semibold'>Shipping address</span>
							</div>
							{hasShippingAddress ? (
								<div className='text-sm space-y-0.5'>
									{order.shipName && (
										<p className='font-medium'>{order.shipName}</p>
									)}
									{order.shipAddress1 && (
										<p className='text-muted-foreground'>
											{order.shipAddress1}
										</p>
									)}
									{order.shipAddress2 && (
										<p className='text-muted-foreground'>
											{order.shipAddress2}
										</p>
									)}
									<p className='text-muted-foreground'>
										{[order.shipCity, order.shipProvinceCode, order.shipZip]
											.filter(Boolean)
											.join(', ')}
									</p>
									{order.shipCountryCode && (
										<p className='text-muted-foreground'>
											{order.shipCountryCode}
										</p>
									)}
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>No address</p>
							)}
						</div>

						{/* payment */}
						<div className='rounded-xl border bg-card p-4 space-y-2'>
							<div className='flex items-center gap-1.5'>
								<CreditCard className='size-3.5 text-muted-foreground' />
								<span className='text-sm font-semibold'>Payment</span>
							</div>
							<div className='space-y-1.5 text-sm'>
								{order.paymentGatewayNames.length > 0 && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Method</span>
										<span className='font-medium text-right capitalize'>
											{order.paymentGatewayNames.join(', ').replace(/_/g, ' ')}
										</span>
									</div>
								)}
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>Status</span>
									<EnumBadge
										value={order.paymentStatus as PaymentStatusEnum}
										className={cn(
											PAYMENT_STYLES[order.paymentStatus as PaymentStatusEnum]
										)}
										allCaps
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
