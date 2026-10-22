'use client';

import type { DashboardDailyPoint } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { CHART_GRANULARITY_LABELS } from '@repo/utils';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useChartGranularity } from '@/hooks/useChartGranularity';
import { ChartGranularityToggle } from '../general/ChartGranularityToggle';
import { toTrendPoints } from './data';

const CHART_CONFIG: ChartConfig = {
	orders: { label: 'Orders', color: 'var(--chart-1)' },
};

interface OrderVolumeTrendChartProps {
	data: DashboardDailyPoint[];
	dateStart?: string;
	dateEnd?: string;
}

export function OrderVolumeTrendChart({
	data,
	dateStart,
	dateEnd,
}: OrderVolumeTrendChartProps) {
	const { granularity, setGranularity } = useChartGranularity({
		dateStart,
		dateEnd,
		points: data,
	});

	const chartData = useMemo(
		() => toTrendPoints(data, granularity),
		[data, granularity]
	);

	if (!chartData.length) {
		return (
			<div className='flex h-56 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground'>
				No data for the selected period
			</div>
		);
	}

	return (
		<div className='rounded-lg border bg-card'>
			<div className='flex items-center justify-between gap-4 border-b px-5 py-3'>
				<h2 className='text-sm font-semibold'>
					Order volume{' '}
					<span className='font-normal text-muted-foreground'>
						· {CHART_GRANULARITY_LABELS[granularity]}
					</span>
				</h2>
				<ChartGranularityToggle value={granularity} onChange={setGranularity} />
			</div>
			<div className='p-4'>
				<ChartContainer config={CHART_CONFIG} className='h-56 w-full'>
					<BarChart
						data={chartData}
						margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
					>
						<CartesianGrid vertical={false} strokeDasharray='3 3' />
						<XAxis
							dataKey='label'
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 11 }}
							interval='preserveStartEnd'
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 11 }}
							allowDecimals={false}
							width={32}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) =>
										payload?.[0]?.payload?.rangeLabel
									}
								/>
							}
						/>
						<Bar
							dataKey='orders'
							fill='var(--color-orders)'
							radius={[3, 3, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}

export function OrderVolumeTrendChartSkeleton() {
	return <div className='h-67 animate-pulse rounded-lg border bg-muted' />;
}
