'use client';

import { DemandPlanKindEnum } from '@repo/enums';
import { Button } from '@repo/ui/components/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { FlaskConical, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import EmptyMessage from '@/components/general/EmptyMessage';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useDemandPlans, useScenarios } from '@/queries';
import { NewScenarioDialog } from './NewScenarioDialog';
import { ScenarioCard } from './ScenarioCard';

const PAGE_DESCRIPTION =
	'Fork a plan to price an opportunity — a new customer, a promotion, a price move — without touching what the business has committed to.';

const ALL = 'all';

const ScenarioPlansComponent = () => {
	const router = useRouter();
	const [basePlanId, setBasePlanId] = useState<string>(ALL);
	const [isCreating, setIsCreating] = useState(false);

	const { data: plans = [] } = useDemandPlans();
	const {
		data: scenarios = [],
		isLoading,
		error,
	} = useScenarios(basePlanId === ALL ? undefined : basePlanId);

	const basePlans = plans
		.filter((plan) => plan.kind === DemandPlanKindEnum.BASE)
		.sort((a, b) => b.planMonth.localeCompare(a.planMonth));

	return (
		<div className='space-y-3'>
			<PageHeader
				title='Scenario Plans'
				description={PAGE_DESCRIPTION}
				actions={
					<Button
						size='sm'
						onClick={() => setIsCreating(true)}
						disabled={basePlans.length === 0}
					>
						<Plus className='size-4' />
						New scenario
					</Button>
				}
			/>

			<div className='flex flex-wrap items-center justify-between gap-3'>
				<p className='text-sm text-muted-foreground'>
					{scenarios.length} scenario{scenarios.length === 1 ? '' : 's'}
				</p>

				<Select value={basePlanId} onValueChange={setBasePlanId}>
					<SelectTrigger className='h-8 w-64 text-xs'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>All plans</SelectItem>
						{basePlans.map((plan) => (
							<SelectItem key={plan.id} value={plan.id}>
								{plan.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{isLoading && <TableSkeleton rows={4} />}

			{!error && !isLoading && scenarios.length === 0 && (
				<div className='rounded-lg border bg-card'>
					<EmptyMessage
						icon={<FlaskConical className='size-8 text-muted-foreground' />}
						message={
							basePlans.length === 0
								? 'No plan to fork yet'
								: 'No scenarios yet'
						}
						description={
							basePlans.length === 0
								? 'A scenario is a copy of a plan, so there has to be a plan first.'
								: 'Fork a plan when you need to price something the committed plan does not assume.'
						}
					/>
				</div>
			)}

			{!error && !isLoading && scenarios.length > 0 && (
				<div className='grid gap-4 lg:grid-cols-2'>
					{scenarios.map((scenario) => (
						<ScenarioCard key={scenario.id} scenario={scenario} />
					))}
				</div>
			)}

			<NewScenarioDialog
				open={isCreating}
				onClose={() => setIsCreating(false)}
				defaultBasePlanId={basePlanId === ALL ? undefined : basePlanId}
				onCreated={(scenario) =>
					router.push(`/demand-planning/scenarios/${scenario.id}`)
				}
			/>
		</div>
	);
};

export default ScenarioPlansComponent;
