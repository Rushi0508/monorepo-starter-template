'use client';

import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@repo/ui/components/chart';
import { formatCurrency } from '@repo/utils';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
	SegmentedToggle,
	type SegmentedToggleOption,
} from '@/components/general/SegmentedToggle';
import { formatNumber } from '../shared/format';
import { periodLabelLong, periodLabelShort } from '../shared/period';
import type { ComparisonTotals, PeriodRange } from './data';

const CHART_CONFIG = {
	a: { label: 'Baseline (A)', color: '#94A3B8' },
	b: { label: 'Compared (B)', color: '#06B6D4' },
} satisfies ChartConfig;

export type CompareChartBy = 'cases' | 'revenue';

const CHART_BY_OPTIONS: SegmentedToggleOption<CompareChartBy>[] = [
	{ value: 'cases', label: 'Cases', title: 'Show planned cases' },
	{ value: 'revenue', label: 'Revenue', title: 'Show planned revenue' },
];

interface CompareMonthlyChartProps {
	months: (ComparisonTotals & { period: string })[];
	chartBy: CompareChartBy;
	onChartByChange: (chartBy: CompareChartBy) => void;
	range?: PeriodRange;
	onRangeChange: (range: PeriodRange) => void;
}

export function CompareMonthlyChart({
	months,
	chartBy,
	onChartByChange,
	range,
	onRangeChange,
}: CompareMonthlyChartProps) {
	const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
	const data = useMemo(
		() =>
			months.map((row) => ({
				period: row.period,
				label: periodLabelShort(row.period),
				rangeLabel: periodLabelLong(row.period),
				a: chartBy === 'cases' ? row.unitsA : row.revenueA,
				b: chartBy === 'cases' ? row.unitsB : row.revenueB,
			})),
		[months, chartBy]
	);

	const formatValue = (value: number) =>
		chartBy === 'cases' ? formatNumber(value) : formatCurrency(value);

	const selected = drag
		? {
				from: data[Math.min(drag.from, drag.to)]?.period ?? '',
				to: data[Math.max(drag.from, drag.to)]?.period ?? '',
			}
		: range;
	const isSelected = (period: string) =>
		!selected || (period >= selected.from && period <= selected.to);

	const indexAt = (state: { activeTooltipIndex?: number | null } | null) =>
		typeof state?.activeTooltipIndex === 'number'
			? state.activeTooltipIndex
			: null;

	const commit = () => {
		if (!drag) return;
		const from = data[Math.min(drag.from, drag.to)]?.period;
		const to = data[Math.max(drag.from, drag.to)]?.period;
		if (from && to) onRangeChange({ from, to });
		setDrag(null);
	};

	return (
		<div className='rounded-lg border bg-card'>
			<div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3'>
				<h2 className='text-sm font-semibold'>
					Month by month{' '}
					<span className='font-normal text-muted-foreground'>
						· Click a month, or drag across several, to break them down below
						{selected
							? `. Showing ${
									selected.from === selected.to
										? periodLabelLong(selected.from)
										: `${periodLabelShort(selected.from)} – ${periodLabelShort(selected.to)}`
								}`
							: ''}
					</span>
				</h2>

				<SegmentedToggle
					value={chartBy}
					onChange={onChartByChange}
					ariaLabel='Chart unit'
					options={CHART_BY_OPTIONS}
					className='w-32'
				/>
			</div>

			<div className='select-none py-4'>
				<ChartContainer config={CHART_CONFIG} className='h-60 w-full'>
					<BarChart
						data={data}
						margin={{ top: 4, right: 8, left: 8 }}
						onMouseDown={(state) => {
							const at = indexAt(state);
							if (at !== null) setDrag({ from: at, to: at });
						}}
						onMouseMove={(state) => {
							const at = indexAt(state);
							if (drag && at !== null && at !== drag.to)
								setDrag({ ...drag, to: at });
						}}
						onMouseUp={commit}
						// Releasing outside the plot would otherwise strand the drag.
						onMouseLeave={commit}
					>
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
							width={chartBy === 'cases' ? 52 : 72}
							className='text-xs'
							tickFormatter={formatValue}
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
												{formatValue(Number(value))}
											</span>
										</div>
									)}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent />} />

						<Bar dataKey='a' fill='var(--color-a)' radius={[3, 3, 0, 0]}>
							{data.map((point) => (
								<Cell
									key={point.period}
									fillOpacity={isSelected(point.period) ? 1 : 0.35}
								/>
							))}
						</Bar>
						<Bar dataKey='b' fill='var(--color-b)' radius={[3, 3, 0, 0]}>
							{data.map((point) => (
								<Cell
									key={point.period}
									fillOpacity={isSelected(point.period) ? 1 : 0.35}
								/>
							))}
						</Bar>
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	);
}
