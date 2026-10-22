'use client';

import type { DashboardDailyPoint } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { CHART_GRANULARITY_LABELS } from '@repo/utils';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useChartGranularity } from '@/hooks/useChartGranularity';
import { ChartGranularityToggle } from '../general/ChartGranularityToggle';
import { toTrendPoints } from './data';

const CHART_CONFIG: ChartConfig = {
	grossRevenue: { label: 'Gross', color: '#D97706' }, // Amber 600
	netRevenue: { label: 'Net', color: '#059669' }, // Emerald 600
};

interface RevenueTrendChartProps {
	data: DashboardDailyPoint[];
	dateStart?: string;
	dateEnd?: string;
}

export function RevenueTrendChart({
	data,
	dateStart,
	dateEnd,
}: RevenueTrendChartProps) {
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
					Revenue{' '}
					<span className='font-normal text-muted-foreground'>
						· {CHART_GRANULARITY_LABELS[granularity]}
					</span>
				</h2>
				<ChartGranularityToggle value={granularity} onChange={setGranularity} />
			</div>
			<div className='p-4'>
				<ChartContainer config={CHART_CONFIG} className='h-56 w-full'>
					<LineChart
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
							tickFormatter={(v: number) =>
								v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
							}
							width={44}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) =>
										payload?.[0]?.payload?.rangeLabel
									}
									formatter={(value) => `$${Number(value).toLocaleString()}`}
								/>
							}
						/>
						{/* Gross before Net so the tooltip and legend read top-down like a
						    P&L: gross revenue first, net beneath it. */}
						<Line
							dataKey='grossRevenue'
							stroke='var(--color-grossRevenue)'
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
						/>
						<Line
							dataKey='netRevenue'
							stroke='var(--color-netRevenue)'
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
						/>
						<ChartLegend content={<ChartLegendContent />} />
					</LineChart>
				</ChartContainer>
			</div>
		</div>
	);
}

export function RevenueTrendChartSkeleton() {
	return <div className='h-67 animate-pulse rounded-lg border bg-muted' />;
}
