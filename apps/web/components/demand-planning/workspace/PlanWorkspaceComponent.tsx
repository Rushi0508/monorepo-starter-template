'use client';

import { DemandPlanKindEnum, DemandPlanStatusEnum } from '@repo/enums';
import { Button } from '@repo/ui/components/button';
import { format } from 'date-fns';
import { LayoutGrid, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import EmptyMessage from '@/components/general/EmptyMessage';
import { useDemandPlan } from '@/queries';
import { PlanGrid } from '../grid/PlanGrid';
import { NewScenarioDialog } from '../scenarios/NewScenarioDialog';
import { AuditLogSheet } from './AuditLogSheet';
import { FinalizePlanDialog } from './FinalizePlanDialog';
import { ImportPlanDialog } from './ImportPlanDialog';
import { NewPlanDialog } from './NewPlanDialog';
import { PlanConfigSheet } from './PlanConfigSheet';
import { PlanWorkspaceHeader } from './PlanWorkspaceHeader';

const PlanWorkspaceComponent = ({ planId }: { planId?: string }) => {
	const router = useRouter();

	const { data: plan, isLoading, error } = useDemandPlan(planId ?? null);

	const [isCreating, setIsCreating] = useState(false);
	const [isViewingActivity, setIsViewingActivity] = useState(false);
	const [isConfiguring, setIsConfiguring] = useState(false);
	const [isFinalizing, setIsFinalizing] = useState(false);
	const [isImporting, setIsImporting] = useState(false);

	const isLocked = Boolean(plan) && plan?.status !== DemandPlanStatusEnum.DRAFT;
	const isScenario = plan?.kind === DemandPlanKindEnum.SCENARIO;

	return (
		<div className='space-y-6'>
			<PlanWorkspaceHeader
				plan={plan ?? null}
				isLoading={isLoading}
				isScenario={isScenario}
				onConfigure={() => setIsConfiguring(true)}
				onNewPlan={() => setIsCreating(true)}
				onViewActivity={() => setIsViewingActivity(true)}
				onFinalize={() => setIsFinalizing(true)}
				onImport={() => setIsImporting(true)}
				canImport={Boolean(plan) && plan?.status === DemandPlanStatusEnum.DRAFT}
			/>

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{!error && isLocked && plan && (
				<AlertMessage
					variant='info'
					message={
						isScenario
							? `This scenario was saved${
									plan.savedAt
										? ` on ${format(plan.savedAt, 'MMM d, yyyy')}`
										: ''
								}, so its cells and settings are locked. Reopen it to make changes.`
							: `This plan was finalized${
									plan.finalizedAt
										? ` on ${format(plan.finalizedAt, 'MMM d, yyyy')}`
										: ''
								}. Its cells, settings and notes are locked — start a new plan to change anything. Actuals keep updating.`
					}
				/>
			)}

			{!error && plan && <PlanGrid plan={plan} />}

			{!error && !plan && !isLoading && (
				<div className='rounded-lg border bg-card'>
					<EmptyMessage
						icon={<LayoutGrid className='size-8 text-muted-foreground' />}
						message='No demand plan yet'
						description='A plan sets the channels and SKUs to forecast, and the horizon to forecast across. Create one and the planning grid appears here.'
						cta={
							<Button
								variant='outline'
								size='sm'
								onClick={() => setIsCreating(true)}
							>
								<Plus className='size-4' />
								New plan
							</Button>
						}
					/>
				</div>
			)}

			{isScenario ? (
				<NewScenarioDialog
					open={isCreating}
					onClose={() => setIsCreating(false)}
					defaultBasePlanId={plan?.basePlanId ?? undefined}
					onCreated={(created) =>
						router.push(`/demand-planning/scenarios/${created.id}`)
					}
				/>
			) : (
				<NewPlanDialog
					open={isCreating}
					onClose={() => setIsCreating(false)}
					onCreated={(created) =>
						router.push(`/demand-planning/workspace/${created.id}`)
					}
				/>
			)}

			{plan && isConfiguring && (
				<PlanConfigSheet
					plan={plan}
					open={isConfiguring}
					onClose={() => setIsConfiguring(false)}
					// Back to the bare route, which resolves whichever plan is
					// operative now — or offers to create one when none is left.
					onDeleted={() =>
						router.replace(
							isScenario
								? '/demand-planning/scenarios'
								: '/demand-planning/workspace'
						)
					}
				/>
			)}

			{plan && isImporting && (
				<ImportPlanDialog
					plan={plan}
					open={isImporting}
					onClose={() => setIsImporting(false)}
				/>
			)}

			{plan && isFinalizing && (
				<FinalizePlanDialog
					plan={plan}
					open={isFinalizing}
					onClose={() => setIsFinalizing(false)}
				/>
			)}

			{plan && isViewingActivity && (
				<AuditLogSheet
					planId={plan.id}
					open={isViewingActivity}
					onClose={() => setIsViewingActivity(false)}
				/>
			)}
		</div>
	);
};

export default PlanWorkspaceComponent;
