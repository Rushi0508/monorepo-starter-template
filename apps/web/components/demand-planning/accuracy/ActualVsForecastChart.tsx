'use client';

import type { DemandAccuracyTrendPointType } from '@repo/types';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatNumber } from '../shared/format';
import { periodLabelLong, periodLabelShort } from '../shared/period';

const CHART_CONFIG = {
	forecast: { label: 'Forecast', color: '#94A3B8' },
	actual: { label: 'Actual', color: '#06B6D4' },
} satisfies ChartConfig;

interface ActualVsForecastChartProps {
	trend: DemandAccuracyTrendPointType[];
	lag: number;
}

export function ActualVsForecastChart({
	trend,
	lag,
}: ActualVsForecastChartProps) {
	const data = useMemo(
		() =>
			trend.map((point) => ({
				label: periodLabelShort(point.period),
				rangeLabel: periodLabelLong(point.period),
				forecast: point.forecast,
				actual: point.actual,
			})),
		[trend]
	);

	return (
		<Card className='shadow-xs gap-1 p-3'>
			<CardHeader className='p-2'>
				<CardTitle>Actual vs forecast, month by month</CardTitle>
				<CardDescription className='text-xs'>
					Every month scored against the plan that existed {lag} month
					{lag === 1 ? '' : 's'} earlier.
				</CardDescription>
			</CardHeader>
			<CardContent className='px-0!'>
				<ChartContainer config={CHART_CONFIG} className='h-60 w-full'>
					<BarChart data={data} margin={{ top: 4, right: 8, left: 8 }}>
						<CartesianGrid vertical={false} strokeDasharray='3 3' />
						<XAxis
							dataKey='label'
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							className='text-xs'
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							width={52}
							className='text-xs'
							tickFormatter={(value: number) => formatNumber(value)}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelKey='rangeLabel'
									formatter={(value, name) => (
										<div className='flex w-full items-center justify-between gap-4'>
											<span className='text-muted-foreground capitalize'>
												{name}
											</span>
											<span className='font-medium tabular-nums'>
												{formatNumber(Number(value))}
											</span>
										</div>
									)}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey='forecast'
							fill='var(--color-forecast)'
							radius={[3, 3, 0, 0]}
						/>
						<Bar
							dataKey='actual'
							fill='var(--color-actual)'
							radius={[3, 3, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
