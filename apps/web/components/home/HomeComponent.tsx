'use client';

import type { DashboardFilterType } from '@repo/types';
import { formatDateLabel } from '@repo/utils';
import { PageHeader } from '@/components/general/PageHeader';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useDashboard } from '@/queries';
import AlertMessage from '../general/AlertMessage';
import { AovTrendChart, AovTrendChartSkeleton } from './AovTrendChart';
import HomeFilters, { EMPTY_HOME_FILTERS } from './HomeFilters';
import MetricsCards from './MetricsCards';
import NewVsReturningChart, {
	NewVsReturningChartSkeleton,
} from './NewVsReturningChart';
import OrderStatusBreakdown, {
	OrderStatusBreakdownSkeleton,
} from './OrderStatusBreakdown';
import {
	OrderVolumeTrendChart,
	OrderVolumeTrendChartSkeleton,
} from './OrderVolumeTrendChart';
import {
	RevenueTrendChart,
	RevenueTrendChartSkeleton,
} from './RevenueTrendChart';
import SessionsBreakdownTable, {
	SessionsBreakdownTableSkeleton,
} from './SessionsBreakdownTable';
import { TopSkusChart, TopSkusChartSkeleton } from './TopSkusChart';

const HomeComponent = () => {
	const { filters, setFilters } =
		useQueryFilters<DashboardFilterType>(EMPTY_HOME_FILTERS);

	const { data, isLoading, error } = useDashboard(filters);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Command Center'
				description={`At-a-glance status across orders, fulfillment and finance. (${formatDateLabel(filters.dateStart, filters.dateEnd)})`}
				actions={<HomeFilters appliedFilters={filters} onApply={setFilters} />}
			/>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			<MetricsCards data={data?.metrics} />

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				{isLoading ? (
					<>
						<OrderStatusBreakdownSkeleton />
						<TopSkusChartSkeleton />
					</>
				) : (
					<>
						{data && <OrderStatusBreakdown data={data.orderStatus} />}
						<TopSkusChart data={data?.topSkus ?? []} />
					</>
				)}
			</div>

			{isLoading ? (
				<RevenueTrendChartSkeleton />
			) : (
				<RevenueTrendChart
					data={data?.dailyTrend ?? []}
					dateStart={filters.dateStart}
					dateEnd={filters.dateEnd}
				/>
			)}

			{isLoading ? (
				<OrderVolumeTrendChartSkeleton />
			) : (
				<OrderVolumeTrendChart
					data={data?.dailyTrend ?? []}
					dateStart={filters.dateStart}
					dateEnd={filters.dateEnd}
				/>
			)}

			{isLoading ? (
				<AovTrendChartSkeleton />
			) : (
				<AovTrendChart
					data={data?.dailyTrend ?? []}
					dateStart={filters.dateStart}
					dateEnd={filters.dateEnd}
				/>
			)}

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
				{isLoading ? (
					<>
						<NewVsReturningChartSkeleton />
						<SessionsBreakdownTableSkeleton />
					</>
				) : (
					<>
						<NewVsReturningChart
							data={
								data?.customerSplit ?? {
									newCustomers: 0,
									returningCustomers: 0,
								}
							}
						/>
						<SessionsBreakdownTable data={data?.sessionBreakdown ?? []} />
					</>
				)}
			</div>
		</div>
	);
};

export default HomeComponent;
