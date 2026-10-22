'use client';

import { tooltips } from '@repo/constants';
import { FulfillmentStatusEnum, PaymentStatusEnum } from '@repo/enums';
import type { DashboardMetrics } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	BarChart,
	ChevronDown,
	Clock,
	CreditCard,
	DollarSign,
	Package,
	ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

interface MetricCardProps {
	label: string;
	value: string | number;
	subtext: string;
	icon: LucideIcon;
	tooltip?: string;
	trend?: { value: number; label: string };
	alert?: boolean;
	alertDetail?: string;
	href?: string;
}

const MetricCard = ({
	label,
	value,
	subtext,
	icon: Icon,
	tooltip,
	trend,
	alert,
	alertDetail,
	href,
}: MetricCardProps) => {
	const isNegative = trend && trend.value < 0;

	const card = (
		<div
			className={cn(
				'relative rounded-lg border bg-card p-5',
				alert && 'border-l-4 border-l-red-500',
				href && 'cursor-pointer transition-colors hover:bg-accent/50'
			)}
		>
			<div className='flex items-start justify-between'>
				<p className='text-muted-foreground flex items-center gap-1 text-xs font-medium uppercase tracking-wider'>
					{label}
					{tooltip && <CustomTooltip content={tooltip} />}
				</p>
				<Icon className='text-muted-foreground size-4' />
			</div>

			<div className='mt-3 flex items-end gap-2'>
				<p className='text-2xl font-semibold tracking-tight'>{value}</p>
				{trend && (
					<span
						className={cn(
							'mb-0.5 flex items-center gap-0.5 text-sm font-medium',
							isNegative ? 'text-red-500' : 'text-emerald-500'
						)}
					>
						{isNegative ? (
							<ArrowDownRight className='size-3.5' />
						) : (
							<ArrowUpRight className='size-3.5' />
						)}
						{Math.abs(trend.value)}%
					</span>
				)}
			</div>

			<p className='text-muted-foreground mt-1 text-xs'>{subtext}</p>
			{alert && alertDetail && (
				<p className='text-muted-foreground mt-1 text-xs'>{alertDetail}</p>
			)}
		</div>
	);

	if (href) {
		return <Link href={href}>{card}</Link>;
	}

	return card;
};

export type MetricsData = DashboardMetrics;

interface MetricsCardsProps {
	data: DashboardMetrics | undefined;
}

const dash = tooltips.dashboard;

const MetricsCards = ({ data }: MetricsCardsProps) => {
	const [expanded, setExpanded] = useState(false);

	if (!data) {
		return (
			<div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className='h-24 animate-pulse rounded-lg border bg-muted'
					/>
				))}
			</div>
		);
	}

	return (
		<div className='space-y-3'>
			<div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
				<MetricCard
					label='Orders'
					value={data.orders}
					subtext='Created in the selected range'
					icon={ShoppingCart}
					tooltip={dash.orders}
				/>
				<MetricCard
					label='Net Revenue'
					value={`$${data.netRevenue.toLocaleString()}`}
					subtext={`${Math.abs(data.netRevenueTrendPercentage)}% ${data.netRevenueTrendPercentage < 0 ? 'down' : 'up'} vs prior period`}
					icon={DollarSign}
					tooltip={dash.netRevenue}
					trend={{
						value: data.netRevenueTrendPercentage,
						label: 'vs prior period',
					}}
				/>
				<MetricCard
					label='Units Shipped'
					value={data.unitsShipped}
					subtext='Fulfilled order quantities'
					icon={Package}
					tooltip={dash.unitsShipped}
				/>
				<MetricCard
					label='Open Alerts'
					value={data.openAlerts}
					subtext={data.alertDetail}
					icon={AlertTriangle}
					tooltip={dash.openAlerts}
					alert={data.openAlerts > 0}
					href={`/orders?paymentStatus=${PaymentStatusEnum.PAID}&fulfillmentStatus=${FulfillmentStatusEnum.UNFULFILLED}&isCancelled=false`}
				/>
			</div>

			<div
				className={cn(
					'grid transition-[grid-template-rows] duration-300 ease-in-out',
					expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
				)}
			>
				<div className='overflow-hidden'>
					<div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
						<MetricCard
							label='Conversion Rate'
							value={`${data.conversionRate}%`}
							subtext='Session checkout rate'
							icon={BarChart}
							tooltip={dash.conversionRate}
						/>
						<MetricCard
							label='Repeat Purchase Rate'
							value={`${data.repeatPurchaseRate}%`}
							subtext='Customers with 2+ orders'
							icon={ShoppingCart}
							tooltip={dash.repeatPurchaseRate}
						/>
						<MetricCard
							label='Avg Time Between Orders'
							value={`${data.avgTimeBetweenOrders}d`}
							subtext='Mean gap for repeat buyers'
							icon={Clock}
							tooltip={dash.avgTimeBetweenOrders}
						/>
						<MetricCard
							label='Active Subscriptions'
							value={data.activeSubscriptions}
							subtext='Active subscription contracts'
							icon={CreditCard}
							tooltip={dash.activeSubscriptions}
						/>
						{/* <MetricCard
							label='Sample Shipment Spend'
							value='$3,240'
							subtext='36 sample cases shipped'
							icon={Megaphone}
							tooltip={dash.sampleShipmentSpend}
						/> */}
					</div>
				</div>
			</div>

			<button
				type='button'
				onClick={() => setExpanded(!expanded)}
				className='mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
			>
				{expanded ? 'Show less' : 'View more metrics'}
				<ChevronDown
					className={cn(
						'size-3.5 transition-transform duration-300',
						expanded && 'rotate-180'
					)}
				/>
			</button>
		</div>
	);
};

export default MetricsCards;
