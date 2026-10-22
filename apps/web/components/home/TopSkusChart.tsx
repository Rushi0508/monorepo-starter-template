'use client';

import type { DashboardTopSku } from '@repo/types';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import CustomTooltip from '@/components/general/CustomTooltip';

const BAR_COLOR = 'var(--chart-1)';
const Y_AXIS_WIDTH = 132;
const TITLE_MAX = 22;
const SKU_MAX = 20;

const CHART_CONFIG: ChartConfig = {
	netRevenue: { label: 'Net Revenue', color: BAR_COLOR },
};

interface TopSkusChartProps {
	data: DashboardTopSku[];
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 1)}…`;
}

/** Two-line Y tick: product title + SKU; CustomTooltip when truncated. */
function SkuAxisTick({
	x,
	y,
	payload,
	bySku,
}: {
	x?: number;
	y?: number;
	payload?: { value?: string };
	bySku: Map<string, { title: string | null; sku: string }>;
}) {
	const sku = payload?.value ?? '';
	const row = bySku.get(sku);
	const title = row?.title?.trim() || null;
	const fullLabel = title ? `${title} (${sku})` : sku;

	const titleDisplay = title ? truncate(title, TITLE_MAX) : null;
	const skuDisplay = truncate(sku, SKU_MAX);

	return (
		<foreignObject
			x={(x ?? 0) - Y_AXIS_WIDTH + 4}
			y={(y ?? 0) - 14}
			width={Y_AXIS_WIDTH - 8}
			height={28}
		>
			<div className='flex h-full items-center justify-end'>
				<CustomTooltip content={fullLabel}>
					<div className='max-w-full cursor-default text-right leading-tight'>
						{titleDisplay ? (
							<>
								<p className='truncate text-[11px] text-foreground'>
									{titleDisplay}
								</p>
								<p className='truncate text-[9px] text-muted-foreground'>
									{skuDisplay}
								</p>
							</>
						) : (
							<p className='truncate text-[11px] text-foreground'>
								{skuDisplay}
							</p>
						)}
					</div>
				</CustomTooltip>
			</div>
		</foreignObject>
	);
}

export function TopSkusChart({ data }: TopSkusChartProps) {
	if (!data.length) {
		return (
			<div className='flex h-full items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground'>
				No SKU data for the selected period
			</div>
		);
	}

	// Category key must be SKU — titles can collide across variants
	const chartData = data.map((d) => ({
		sku: d.sku,
		title: d.title,
		netRevenue: d.netRevenue,
		units: d.units,
	}));
	const bySku = new Map(chartData.map((d) => [d.sku, d]));

	return (
		<div className='rounded-lg border bg-card'>
			<div className='border-b px-5 py-4'>
				<h2 className='text-sm font-semibold'>
					Top 5 SKUs{' '}
					<span className='font-normal text-muted-foreground'>
						· By net revenue
					</span>
				</h2>
			</div>
			<div className='overflow-visible py-4 pr-4'>
				<ChartContainer
					config={CHART_CONFIG}
					className='h-56 w-full overflow-visible [&_.recharts-surface]:overflow-visible'
				>
					<BarChart
						data={chartData}
						layout='vertical'
						margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
						barCategoryGap='8%'
					>
						<XAxis
							type='number'
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 11 }}
							tickFormatter={(v: number) =>
								v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
							}
						/>
						<YAxis
							type='category'
							dataKey='sku'
							tickLine={false}
							axisLine={false}
							width={Y_AXIS_WIDTH}
							tick={<SkuAxisTick bySku={bySku} />}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									labelFormatter={(_, payload) => {
										const row = payload?.[0]?.payload as
											| (typeof chartData)[number]
											| undefined;
										if (!row) return '';
										return row.title ? `${row.title} · ${row.sku}` : row.sku;
									}}
									formatter={(value, name) => {
										if (name === 'netRevenue')
											return `$${Number(value).toLocaleString()}`;
										return String(value);
									}}
								/>
							}
						/>
						<Bar dataKey='netRevenue' radius={[0, 3, 3, 0]}>
							{chartData.map((_, i) => (
								<Cell
									key={chartData[i]?.sku}
									fill={BAR_COLOR}
									fillOpacity={1 - i * 0.12}
								/>
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}

export function TopSkusChartSkeleton() {
	return <div className='h-67 animate-pulse rounded-lg border bg-muted' />;
}
