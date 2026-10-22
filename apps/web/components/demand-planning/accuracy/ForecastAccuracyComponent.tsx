'use client';

import type { DemandAccuracyFilterType } from '@repo/types';
import { Card, CardContent } from '@repo/ui/components/card';
import { FileSearch } from 'lucide-react';
import { useMemo } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import EmptyMessage from '@/components/general/EmptyMessage';
import { PageHeader } from '@/components/general/PageHeader';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useDemandAccuracy } from '@/queries';
import { periodLabelLong } from '../shared/period';
import { AccuracyByChannelTable } from './AccuracyByChannelTable';
import { AccuracyByLagTable } from './AccuracyByLagTable';
import AccuracyFilters, {
	EMPTY_DEMAND_ACCURACY_FILTERS,
} from './AccuracyFilters';
import { AccuracyKpiCards } from './AccuracyKpiCards';
import { AccuracyMissesTable } from './AccuracyMissesTable';
import { ActualVsForecastChart } from './ActualVsForecastChart';
import { ForecastAccuracySkeleton } from './ForecastAccuracySkeleton';

const PAGE_DESCRIPTION =
	'How good were we? Every score is measured against the forecast that existed at the time, which is only possible because finalized plans are immutable.';

const ForecastAccuracyComponent = () => {
	const { filters, setFilters } = useQueryFilters<DemandAccuracyFilterType>(
		EMPTY_DEMAND_ACCURACY_FILTERS
	);

	// useQueryFilters types a value by its default, and lag has none until the
	// server says which lags exist — so it comes back off the URL as a string.
	const query = useMemo(
		() => ({ ...filters, lag: filters.lag ? Number(filters.lag) : undefined }),
		[filters]
	);

	const { data: accuracy, isLoading, error } = useDemandAccuracy(query);

	return (
		<div className='space-y-4'>
			<PageHeader title='Forecast Accuracy' description={PAGE_DESCRIPTION} />

			<AccuracyFilters
				appliedFilters={filters}
				onApply={setFilters}
				availablePeriods={accuracy?.availablePeriods ?? []}
				availableLags={accuracy?.availableLags ?? []}
				activePeriod={accuracy?.demandPeriod}
				activeLag={accuracy?.lag}
			/>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{!error && isLoading && <ForecastAccuracySkeleton />}

			{!error && !isLoading && accuracy?.summary && (
				<>
					<AccuracyKpiCards accuracy={accuracy} />

					<ActualVsForecastChart trend={accuracy.trend} lag={accuracy.lag} />

					<div className='grid gap-4 lg:grid-cols-2'>
						<AccuracyByLagTable
							rows={accuracy.byLag}
							activeLag={accuracy.lag}
						/>
						<AccuracyByChannelTable
							rows={accuracy.byChannel}
							rollup={accuracy.summary}
						/>
					</div>

					<AccuracyMissesTable
						misses={accuracy.misses}
						demandPeriod={accuracy.demandPeriod}
					/>
				</>
			)}

			{!error && !isLoading && accuracy && !accuracy.summary && (
				<Card className='shadow-xs'>
					<CardContent>
						<EmptyMessage
							icon={<FileSearch className='size-8 text-muted-foreground' />}
							message={
								accuracy.availablePeriods.length === 0
									? 'Nothing to score yet'
									: 'No plan to score against'
							}
							description={
								accuracy.availablePeriods.length === 0
									? 'Accuracy compares a finalized plan against the months that have since closed. Once a plan is finalized and a month it forecast has ended, its scores appear here.'
									: `Scoring ${periodLabelLong(accuracy.demandPeriod)} at lag ${accuracy.lag} needs a plan finalized in ${periodLabelLong(accuracy.expectedPlanMonth)}, and there isn't one. Try another lag or period.`
							}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default ForecastAccuracyComponent;
