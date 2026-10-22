'use client';

import type { DemandComparisonFilterType } from '@repo/types';
import { GitCompare } from 'lucide-react';
import { useMemo, useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import EmptyMessage from '@/components/general/EmptyMessage';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useDemandPlans, usePlanComparison } from '@/queries';
import { periodLabel } from '../shared/period';
import { CompareKpiCards } from './CompareKpiCards';
import {
	type CompareChartBy,
	CompareMonthlyChart,
} from './CompareMonthlyChart';
import { CompareMoversTable } from './CompareMoversTable';
import { ComparePlanPicker } from './ComparePlanPicker';
import {
	byPeriod,
	type MoversBy,
	type PeriodRange,
	rollUpMovers,
	totalsOf,
} from './data';

const PAGE_DESCRIPTION =
	'Start from the whole plan, zoom into the month that moved most, then the SKUs that moved it — and see whether growth came from volume or price.';

export const EMPTY_FILTERS: DemandComparisonFilterType = {
	planAId: undefined,
	planBId: undefined,
};

const ComparePlansComponent = () => {
	const { data: plans = [], isLoading: isLoadingPlans } = useDemandPlans();
	const { filters, setFilters } =
		useQueryFilters<DemandComparisonFilterType>(EMPTY_FILTERS);

	const { planAId, planBId } = filters;

	const [range, setRange] = useState<PeriodRange>();
	const [chartBy, setChartBy] = useState<CompareChartBy>('cases');
	const [moversBy, setMoversBy] = useState<MoversBy>('sku');

	const {
		data: comparison,
		isLoading,
		error,
	} = usePlanComparison(planAId ?? null, planBId ?? null);

	const total = useMemo(
		() => (comparison ? totalsOf(comparison.rows) : null),
		[comparison]
	);
	const months = useMemo(
		() => (comparison ? byPeriod(comparison) : []),
		[comparison]
	);

	const wholeWindow = comparison?.periods.length
		? {
				from: comparison.periods[0] as string,
				to: comparison.periods[comparison.periods.length - 1] as string,
			}
		: undefined;
	const selectedRange = range ?? wholeWindow;

	const movers = useMemo(
		() =>
			comparison && selectedRange
				? rollUpMovers(comparison.rows, selectedRange, moversBy)
				: [],
		[comparison, selectedRange, moversBy]
	);

	const bothPicked = Boolean(planAId && planBId && planAId !== planBId);
	const sharedMonths = comparison?.periods.length ?? 0;

	return (
		<div className='space-y-4'>
			<PageHeader title='Compare Plans' description={PAGE_DESCRIPTION} />

			<ComparePlanPicker
				plans={plans}
				planAId={planAId}
				planBId={planBId}
				onChange={(next) => {
					setFilters({ ...filters, ...next });
					setRange(undefined);
				}}
				comparison={comparison}
			/>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{isLoading && <TableSkeleton rows={6} />}

			{!bothPicked && !isLoading && !isLoadingPlans && (
				<div className='rounded-lg border bg-card'>
					<EmptyMessage
						icon={<GitCompare className='size-8 text-muted-foreground' />}
						message={
							plans.length < 2
								? 'Nothing to compare yet'
								: 'Pick two different plans'
						}
						description={
							plans.length < 2
								? 'Comparing needs two plans. Finalize the open cycle and start the next one, and this page fills in.'
								: 'A plan compared with itself has nothing to show.'
						}
					/>
				</div>
			)}

			{comparison && sharedMonths === 0 && (
				<AlertMessage
					variant='info'
					message={`These plans never overlap — ${comparison.planA.name} runs to ${periodLabel(
						comparison.planA.horizonEnd
					)} and ${comparison.planB.name} starts at ${periodLabel(
						comparison.planB.planMonth
					)}. There is no shared month to diff.`}
				/>
			)}

			{comparison && total && sharedMonths > 0 && (
				<>
					<CompareKpiCards total={total} />

					<CompareMonthlyChart
						months={months}
						chartBy={chartBy}
						onChartByChange={setChartBy}
						range={selectedRange}
						onRangeChange={setRange}
					/>

					<CompareMoversTable
						movers={movers}
						range={selectedRange}
						moversBy={moversBy}
						onMoversByChange={setMoversBy}
					/>
				</>
			)}
		</div>
	);
};

export default ComparePlansComponent;
