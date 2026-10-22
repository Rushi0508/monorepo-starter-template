'use client';

import type { RevenueFilterType } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatDateLabel } from '@repo/utils';
import { PageHeader } from '@/components/general/PageHeader';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useRevenue } from '@/queries';
import AlertMessage from '../general/AlertMessage';
import { DocLink } from '../general/DocLink';
import {
	DailyRevenueChart,
	DailyRevenueChartSkeleton,
} from './DailyRevenueChart';
import { MetricCards, MetricCardsSkeleton } from './MetricCards';
import {
	RevenueBreakdownTable,
	RevenueBreakdownTableSkeleton,
} from './RevenueBreakdownTable';
import RevenueFilters, { EMPTY_REVENUE_FILTERS } from './RevenueFilters';

const RevenueComponent = () => {
	const { filters, setFilters } = useQueryFilters<RevenueFilterType>(
		EMPTY_REVENUE_FILTERS
	);

	const { data, isLoading, isPlaceholderData, error } = useRevenue(filters);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Revenue'
				description={`Sales performance by channel and SKU. (${formatDateLabel(filters.orderDateStart, filters.orderDateEnd)})`}
				actions={
					<div className='flex flex-col items-end gap-2'>
						<RevenueFilters appliedFilters={filters} onApply={setFilters} />
						<DocLink doc='business/calculations' section='revenue-and-profit'>
							How is this calculated?
						</DocLink>
					</div>
				}
			/>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{isLoading && (
				<>
					<MetricCardsSkeleton />
					<DailyRevenueChartSkeleton />
					<RevenueBreakdownTableSkeleton />
				</>
			)}

			{data && (
				<div
					className={cn(
						'space-y-6 transition-opacity',
						isPlaceholderData && 'opacity-60'
					)}
				>
					<MetricCards metrics={data.metrics} />

					<DailyRevenueChart
						data={data.dailyRevenue}
						groupBy={data.chartBy}
						selectedGroupBy={filters.chartBy ?? 'channel'}
						onGroupByChange={(chartBy) => setFilters({ ...filters, chartBy })}
						dateStart={filters.orderDateStart}
						dateEnd={filters.orderDateEnd}
					/>

					<RevenueBreakdownTable
						rows={data.breakdown}
						breakdownBy={data.breakdownBy}
						selectedBreakdownBy={filters.breakdownBy ?? 'channel'}
						onBreakdownByChange={(breakdownBy) =>
							setFilters({ ...filters, breakdownBy })
						}
					/>
				</div>
			)}
		</div>
	);
};

export default RevenueComponent;
