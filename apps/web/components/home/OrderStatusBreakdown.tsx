'use client';

import type { DashboardOrderStatusItem } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { Cell, Pie, PieChart } from 'recharts';

export type OrderStatusData = DashboardOrderStatusItem;

interface OrderStatusBreakdownProps {
	data: DashboardOrderStatusItem[];
}

const OrderStatusBreakdown = ({ data }: OrderStatusBreakdownProps) => {
	const total = data.reduce((sum, d) => sum + d.count, 0);

	const chartConfig = data.reduce<ChartConfig>((acc, d) => {
		acc[d.key] = { label: d.label, color: d.color };
		return acc;
	}, {});

	const chartData = data.map((d) => ({
		name: d.key,
		value: d.count,
		color: d.color,
	}));

	return (
		<div className='rounded-lg border bg-card'>
			<div className='border-b px-5 py-4'>
				<h2 className='text-sm font-semibold'>Order status breakdown</h2>
			</div>

			<div className='flex flex-col items-center gap-8 p-6 sm:flex-row justify-center'>
				{/* Donut chart */}
				<ChartContainer config={chartConfig} className='h-48 w-48 shrink-0'>
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

				{/* Legend */}
				<div className='flex flex-col gap-2.5'>
					{data.map((d) => {
						const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
						return (
							<div key={d.key} className='flex items-center gap-3'>
								<span
									className='inline-block size-2.5 shrink-0 rounded-full'
									style={{ backgroundColor: d.color }}
								/>
								<span className='text-muted-foreground w-36 text-sm'>
									{d.label}
								</span>
								<span className='w-6 text-right text-sm font-medium'>
									{d.count}
								</span>
								<span className='text-muted-foreground w-8 text-right text-sm'>
									{pct}%
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export function OrderStatusBreakdownSkeleton() {
	return <div className='h-[268px] animate-pulse rounded-lg border bg-muted' />;
}

export default OrderStatusBreakdown;
