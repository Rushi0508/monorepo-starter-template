'use client';

import { tooltips } from '@repo/constants';
import type { FulfillmentMetrics } from '@repo/types';
import { Clock, PackageCheck, Truck } from 'lucide-react';
import CustomTooltip from '@/components/general/CustomTooltip';

const LABEL_CLS =
	'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

const ful = tooltips.fulfillmentPage;

interface MetricCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub: string;
	tooltip?: string;
}

function MetricCard({ icon, label, value, sub, tooltip }: MetricCardProps) {
	return (
		<div className='rounded-xl border bg-card p-5 flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<p className={`${LABEL_CLS} flex items-center gap-1`}>
					{label}
					{tooltip && <CustomTooltip content={tooltip} />}
				</p>
				<span className='text-muted-foreground'>{icon}</span>
			</div>
			<p className='text-3xl font-bold tabular-nums'>{value}</p>
			<p className='text-xs text-muted-foreground'>{sub}</p>
		</div>
	);
}

interface FulfillmentMetricsProps {
	metrics: FulfillmentMetrics;
}

export function FulfillmentMetricsCards({ metrics }: FulfillmentMetricsProps) {
	const onTimeSub =
		metrics.d2cMaxTransitDays === metrics.b2bMaxTransitDays
			? `Delivered ≤ ${metrics.d2cMaxTransitDays}d`
			: `DTC ≤ ${metrics.d2cMaxTransitDays}d · B2B ≤ ${metrics.b2bMaxTransitDays}d`;

	return (
		<div className='grid grid-cols-3 gap-4'>
			<MetricCard
				icon={<PackageCheck className='size-4' />}
				label='Avg Lead Time'
				value={`${metrics.avgLeadTime}d`}
				sub='Order placed → delivered'
				tooltip={ful.avgLeadTime}
			/>
			<MetricCard
				icon={<Clock className='size-4' />}
				label='Avg Transit Time'
				value={`${metrics.avgTransitTime}d`}
				sub='Shipped → delivered (Bluebox)'
				tooltip={ful.avgTransitTime}
			/>
			<MetricCard
				icon={<Truck className='size-4' />}
				label='On-Time Rate'
				value={`${metrics.onTimeRate}%`}
				sub={onTimeSub}
				tooltip={ful.onTimeRate}
			/>
		</div>
	);
}

export function FulfillmentMetricsSkeleton() {
	return (
		<div className='grid grid-cols-3 gap-4'>
			{Array.from({ length: 3 }).map((_, i) => (
				<div
					key={i}
					className='h-32 animate-pulse rounded-xl border bg-muted'
				/>
			))}
		</div>
	);
}
