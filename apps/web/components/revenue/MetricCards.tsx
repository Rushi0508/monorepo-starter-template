'use client';

import { tooltips } from '@repo/constants';
import type { RevenueMetrics } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@repo/utils/string.utils';
import { DollarSign, Minus, TrendingUp } from 'lucide-react';
import React from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

const LABEL_CLS =
	'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

interface CardProps {
	icon?: React.ReactNode;
	mainLabel: string;
	mainValue: string;
	mainValueClassName?: string;
	mainTooltip?: string;
	secondaryIcon?: React.ReactNode;
	secondaryLabel?: string;
	secondaryValue?: string;
	secondaryValueClassName?: string;
	secondaryDescription?: string;
	secondaryCaption?: string;
	secondaryTooltip?: string;
}

function Card({
	icon,
	mainLabel,
	mainValue,
	mainValueClassName,
	mainTooltip,
	secondaryIcon,
	secondaryLabel,
	secondaryValue,
	secondaryValueClassName,
	secondaryDescription,
	secondaryCaption,
	secondaryTooltip,
}: CardProps) {
	return (
		<div className='flex flex-col gap-0 rounded-xl border bg-card p-5'>
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<p className={cn(LABEL_CLS, 'flex items-center gap-1')}>
						{mainLabel}
						{mainTooltip && <CustomTooltip content={mainTooltip} />}
					</p>
					{icon && <span className='text-muted-foreground'>{icon}</span>}
				</div>
				<p className={cn('text-xl font-bold', mainValueClassName)}>
					{mainValue}
				</p>
			</div>

			{secondaryLabel && <div className='my-3 border-t' />}
			{secondaryLabel && (
				<div className='space-y-1'>
					<div className='flex items-center justify-between'>
						<p className={cn(LABEL_CLS, 'flex items-center gap-1')}>
							{secondaryLabel}
							{secondaryTooltip && <CustomTooltip content={secondaryTooltip} />}
						</p>
						{secondaryIcon && (
							<span className='text-muted-foreground'>{secondaryIcon}</span>
						)}
					</div>
					<p className={cn('text-2xl font-bold', secondaryValueClassName)}>
						{secondaryValue}
					</p>
					<p className={cn('text-xs font-medium text-muted-foreground')}>
						{secondaryDescription}
					</p>
					<p className='text-[10px] text-muted-foreground'>
						{secondaryCaption}
					</p>
				</div>
			)}
		</div>
	);
}

interface MetricCardsProps {
	metrics: RevenueMetrics;
}

const rev = tooltips.revenuePage;

export function MetricCards({ metrics }: MetricCardsProps) {
	const {
		grossRevenue,
		discounts,
		refunds,
		netRevenue,
		totalCasesSold,
		cogs,
		grossProfit,
		grossMarginPercentage,
		fulfillmentCost,
		contributionProfit,
		contributionMarginPercentage,
	} = metrics;

	return (
		<div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5'>
			<Card
				mainLabel='Gross Revenue'
				mainValue={formatCurrency(grossRevenue)}
				mainValueClassName='text-2xl font-bold'
				mainTooltip={rev.grossRevenue}
				icon={<DollarSign className='size-3.5' />}
			/>

			<Card
				icon={<Minus className='size-3.5' />}
				mainLabel='Discounts'
				mainValue={`-${formatCurrency(discounts)}`}
				mainValueClassName='text-2xl font-bold text-red-500'
				mainTooltip={rev.discounts}
				secondaryLabel='Refunds'
				secondaryValue={`-${formatCurrency(refunds)}`}
				secondaryValueClassName='text-xl font-bold text-red-500'
				secondaryTooltip={rev.refunds}
			/>

			<Card
				icon={<TrendingUp className='size-3.5' />}
				mainLabel='Net Revenue'
				mainValue={formatCurrency(netRevenue)}
				mainValueClassName='text-2xl font-bold'
				mainTooltip={rev.netRevenue}
				secondaryLabel='Total Cases Sold'
				secondaryValue={totalCasesSold.toLocaleString()}
				secondaryValueClassName='text-xl font-bold'
				secondaryTooltip={rev.casesSold}
			/>

			<Card
				mainLabel='Less: COGs'
				mainValue={`-${formatCurrency(cogs)}`}
				mainValueClassName='text-2xl font-bold text-red-500'
				mainTooltip={rev.cogs}
				secondaryLabel='Gross Margin'
				secondaryValue={`${grossMarginPercentage}%`}
				secondaryValueClassName={cn(
					'text-2xl font-bold',
					grossMarginPercentage >= 0 ? 'text-emerald-600' : 'text-red-500'
				)}
				secondaryDescription={`${formatCurrency(grossProfit)} Gross profit`}
				secondaryTooltip={rev.grossMargin}
			/>

			<Card
				mainLabel='Less: Fulfillment Cost'
				mainValue={`-${formatCurrency(fulfillmentCost)}`}
				mainValueClassName='text-2xl font-bold text-red-500'
				mainTooltip={rev.fulfillmentCost}
				secondaryLabel='Contribution Margin'
				secondaryValue={`${contributionMarginPercentage}%`}
				secondaryValueClassName={cn(
					'text-2xl font-bold',
					contributionMarginPercentage >= 0
						? 'text-emerald-600'
						: 'text-red-500'
				)}
				secondaryDescription={`${formatCurrency(contributionProfit)} Contribution profit`}
				secondaryTooltip={rev.contributionMargin}
			/>
		</div>
	);
}

export function MetricCardsSkeleton() {
	return (
		<div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5'>
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className='h-36 animate-pulse rounded-xl border bg-muted'
				/>
			))}
		</div>
	);
}
