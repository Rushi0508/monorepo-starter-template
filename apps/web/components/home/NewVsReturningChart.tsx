'use client';

import type { CustomerSplit } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { Cell, Pie, PieChart } from 'recharts';

interface NewVsReturningChartProps {
	data: CustomerSplit;
}

const CHART_CONFIG = {
	new: { label: 'New customers', color: '#6366f1' },
	returning: { label: 'Returning customers', color: '#22c55e' },
} satisfies ChartConfig;

const NewVsReturningChart = ({ data }: NewVsReturningChartProps) => {
	const total = data.newCustomers + data.returningCustomers;

	const chartData = [
		{ name: 'new', value: data.newCustomers, color: CHART_CONFIG.new.color },
		{
			name: 'returning',
			value: data.returningCustomers,
			color: CHART_CONFIG.returning.color,
		},
	];

	const items = [
		{
			key: 'new',
			label: 'New',
			count: data.newCustomers,
			color: CHART_CONFIG.new.color,
		},
		{
			key: 'returning',
			label: 'Returning',
			count: data.returningCustomers,
			color: CHART_CONFIG.returning.color,
		},
	];

	return (
		<div className='rounded-lg border bg-card'>
			<div className='border-b px-5 py-4'>
				<h2 className='text-sm font-semibold'>New vs returning customers</h2>
				<p className='mt-0.5 text-xs text-muted-foreground'>
					New = 1 order · Returning = 2+ orders in selected period
				</p>
			</div>

			<div className='flex flex-col items-center gap-8 p-6 sm:flex-row justify-center'>
				<ChartContainer config={CHART_CONFIG} className='h-48 w-48 shrink-0'>
					<PieChart>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} />
						<Pie
							data={chartData}
							cx='50%'
							cy='50%'
							innerRadius='60%'
							outerRadius='85%'
							paddingAngle={2}
							dataKey='value'
							strokeWidth={0}
						>
							{chartData.map((entry) => (
								<Cell key={entry.name} fill={entry.color} />
							))}
						</Pie>
					</PieChart>
				</ChartContainer>

				<div className='flex flex-col gap-2.5'>
					{items.map(({ key, label, count, color }) => {
						const pct = total > 0 ? Math.round((count / total) * 100) : 0;
						return (
							<div key={key} className='flex items-center gap-3'>
								<span
									className='inline-block size-2.5 shrink-0 rounded-full'
									style={{ backgroundColor: color }}
								/>
								<span className='w-24 text-sm text-muted-foreground'>
									{label}
								</span>
								<span className='w-8 text-right text-sm font-medium'>
									{count.toLocaleString()}
								</span>
								<span className='w-8 text-right text-sm text-muted-foreground'>
									{pct}%
								</span>
							</div>
						);
					})}
					{total === 0 && (
						<p className='text-sm text-muted-foreground'>
							No order data for this period.
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export function NewVsReturningChartSkeleton() {
	return <div className='h-[204px] animate-pulse rounded-lg border bg-muted' />;
}

export default NewVsReturningChart;
