'use client';

import AlertMessage from '@/components/general/AlertMessage';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useDemandPlans } from '@/queries';
import { PlanHistoryTable } from './PlanHistoryTable';

const PAGE_DESCRIPTION =
	'Every plan, newest first. Finalized plans are immutable — opening one reproduces exactly what was signed off.';

const PlanHistoryComponent = () => {
	const { data: plans = [], isLoading, error } = useDemandPlans();

	if (error) {
		return <AlertMessage message={error.message} variant='destructive' />;
	}

	return (
		<div className='space-y-4'>
			<PageHeader title='Plan History' description={PAGE_DESCRIPTION} />

			{isLoading ? (
				<TableSkeleton rows={6} />
			) : (
				<PlanHistoryTable plans={plans} />
			)}
		</div>
	);
};

export default PlanHistoryComponent;
