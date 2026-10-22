'use client';

import { ChannelEnum } from '@repo/enums';
import type { RevenueDailyPoint, RevenueGroupBy } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { CHART_GRANULARITY_LABELS } from '@repo/utils';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useChartGranularity } from '@/hooks/useChartGranularity';
import { ChartGranularityToggle } from '../general/ChartGranularityToggle';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '../general/SegmentedToggle';
import {
	OTHER_SERIES,
	type RevenueChartMetric,
	toChannelBars,
	toSkuBars,
} from './data';

const CHANNEL_COLORS: Record<ChannelEnum, string> = {
	[ChannelEnum.DTC]: '#06B6D4',
	[ChannelEnum.DTC_POS]: '#10B981',
	[ChannelEnum.AMAZON]: '#F97316',
	[ChannelEnum.WS_ECOM]: '#8B5CF6',
	[ChannelEnum.WS_DSD]: '#F59E0B',
	[ChannelEnum.WS_CHAINS]: '#EC4899',
	[ChannelEnum.ALTERNATIVE]: '#14B8A6',
};

const CHANNELS = Object.values(ChannelEnum);

const CHANNEL_CHART_CONFIG: ChartConfig = Object.fromEntries(
	CHANNELS.map((c) => [c, { label: c, color: CHANNEL_COLORS[c] }])
);

/** Series colours for the SKU view, in rank order; "Other" is always neutral. */
const SKU_COLORS = [
	'#06B6D4',
	'#8B5CF6',
	'#F59E0B',
	'#10B981',
	'#EF4444',
	'#3B82F6',
	'#EC4899',
	'#84CC16',
];
const OTHER_COLOR = '#94A3B8';

const METRIC_OPTIONS: SegmentedToggleOption<RevenueChartMetric>[] = [
	{ value: 'net', label: 'Revenue', title: 'Net revenue' },
	{ value: 'cases', label: 'Quantity', title: 'Cases sold' },
];

const GROUP_BY_OPTIONS: SegmentedToggleOption<RevenueGroupBy>[] = [
	{ value: 'channel', label: 'Channel', title: 'Stack by channel' },
	{ value: 'sku', label: 'SKU', title: 'Stack by SKU' },
];

const formatRevenue = (v: number) =>
	v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

const formatCases = (v: number) =>
	v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;

interface DailyRevenueChartProps {
	data: RevenueDailyPoint[];
	/** How each point in `data` is split */
	groupBy: RevenueGroupBy;
	/** What the toggle shows — ahead of `groupBy` while the new split loads */
	selectedGroupBy: RevenueGroupBy;
	onGroupByChange: (groupBy: RevenueGroupBy) => void;
	dateStart?: string;
	dateEnd?: string;
}

export function DailyRevenueChart({
	data,
	groupBy,
	selectedGroupBy,
	onGroupByChange,
	dateStart,
	dateEnd,
}: DailyRevenueChartProps) {
	const { granularity, setGranularity } = useChartGranularity({
		dateStart,
		dateEnd,
		points: data,
	});
	const [metric, setMetric] = useState<RevenueChartMetric>('net');

	const { bars, series, config } = useMemo(() => {
		if (groupBy === 'channel') {
			return {
				bars: toChannelBars(data, granularity, metric),
				series: CHANNELS as string[],
				config: CHANNEL_CHART_CONFIG,
			};
		}

		const skuBars = toSkuBars(data, granularity, metric);
		const skuConfig: ChartConfig = Object.fromEntries(
			skuBars.series.map((key, index) => [
				key,
				key === OTHER_SERIES
					? { label: 'Other SKUs', color: OTHER_COLOR }
					: {
							// By code: different SKUs can share a product title
							label: key,
							color: SKU_COLORS[index % SKU_COLORS.length],
						},
			])
		);

		return { bars: skuBars.bars, series: skuBars.series, config: skuConfig };
	}, [data, groupBy, granularity, metric]);

	const isRevenue = metric === 'net';

	if (!bars.length) {
		return (
			<div className='flex h-56 items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground'>
				No data for the selected period
			</div>
		);
	}

	return (
		<div className='rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<h2 className='text-sm font-semibold'>
					{isRevenue ? 'Net revenue' : 'Cases sold'} by{' '}
					{groupBy === 'sku' ? 'SKU' : 'channel'}{' '}
					<span className='font-normal text-muted-foreground'>
						· {CHART_GRANULARITY_LABELS[granularity]}
					</span>
				</h2>
				<div className='flex flex-wrap items-center gap-2'>
					<SegmentedToggle
						value={selectedGroupBy}
						onChange={onGroupByChange}
						options={GROUP_BY_OPTIONS}
						ariaLabel='Stack by'
						className='w-32'
					/>
					<SegmentedToggle
						value={metric}
						onChange={setMetric}
						options={METRIC_OPTIONS}
						ariaLabel='Chart metric'
					/>
					<ChartGranularityToggle
						value={granularity}
						onChange={setGranularity}
					/>
				</div>
			</div>

			<div className='p-4'>
				<ChartContainer config={config} className='h-64 w-full'>
					<BarChart
						data={bars}
						margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
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
								isRevenue ? formatRevenue(v) : formatCases(v)
							}
							width={40}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) =>
										payload?.[0]?.payload?.rangeLabel
									}
									// The tooltip already names each series; show only the value
									formatter={(value) =>
										isRevenue
											? `$${Number(value).toLocaleString()}`
											: `${Number(value).toLocaleString()} cases`
									}
								/>
							}
						/>
						{series.map((key, i) => (
							<Bar
								key={key}
								dataKey={key}
								stackId='a'
								fill={config[key]?.color}
								radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
							/>
						))}
						<ChartLegend content={<ChartLegendContent />} />
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}

export function DailyRevenueChartSkeleton() {
	return <div className='h-80 animate-pulse rounded-xl border bg-muted' />;
}
