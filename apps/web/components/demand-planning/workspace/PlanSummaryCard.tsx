'use client';

import { DemandPlanKindEnum, DemandPlanStatusEnum } from '@repo/enums';
import type { DemandPlanType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
	ArrowUpRight,
	CalendarPlus,
	Copy,
	GitCompare,
	Lock,
	LockOpen,
	ScrollText,
	Settings2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { usePlanLifecycle, useScenarioActions } from '@/queries';
import { DuplicateScenarioDialog } from '../scenarios/DuplicateScenarioDialog';
import { PlanKindBadge, PlanStatusBadge } from '../shared/PlanBadges';
import { monthsBetween, periodLabel } from '../shared/period';

/**
 * Which plan you are looking at, the window it covers, its state, and the two
 * actions that operate on it.
 *
 * Activity and Configure live here rather than in the page header because they
 * act on *this plan*; New plan is page-scoped and stays above.
 */

interface PlanSummaryCardProps {
	plan: DemandPlanType;
	onConfigure: () => void;
	onViewActivity: () => void;
	onFinalize: () => void;
}

export const PlanSummaryCard = ({
	plan,
	onConfigure,
	onViewActivity,
	onFinalize,
}: PlanSummaryCardProps) => {
	// Scenarios are saved rather than finalized, and a locked plan has nothing
	// left to sign off.
	const router = useRouter();
	const { save, reopen, promote } = useScenarioActions();
	const { unlock, rollForward } = usePlanLifecycle();
	const [confirmingPromote, setConfirmingPromote] = useState(false);
	const [confirmingUnlock, setConfirmingUnlock] = useState(false);
	const [confirmingRoll, setConfirmingRoll] = useState(false);
	const [confirmingDuplicate, setConfirmingDuplicate] = useState(false);

	const isScenario = plan.kind === DemandPlanKindEnum.SCENARIO;
	const isDraft = plan.status === DemandPlanStatusEnum.DRAFT;
	const canFinalize = isDraft && !isScenario;
	const isFinalPlan = !isScenario && !isDraft;

	return (
		<>
			<div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3'>
				<div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
					<span className='font-medium'>{plan.name}</span>

					<PlanStatusBadge status={plan.status} kind={plan.kind} />
					<PlanKindBadge kind={plan.kind} />

					<span className='text-sm text-muted-foreground'>
						{periodLabel(plan.planMonth)} → {periodLabel(plan.horizonEnd)}
						<span className='mx-1.5'>·</span>
						{monthsBetween(plan.planMonth, plan.horizonEnd)} months
					</span>
				</div>

				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={onViewActivity}>
						<ScrollText className='size-4' />
						Activity
					</Button>
					<Button variant='outline' size='sm' onClick={onConfigure}>
						<Settings2 className='size-4' />
						Configure
					</Button>
					{canFinalize && (
						<Button size='sm' onClick={onFinalize}>
							<Lock className='size-4' />
							Finalize plan
						</Button>
					)}
					{isFinalPlan && (
						<>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setConfirmingRoll(true)}
								disabled={rollForward.isPending}
							>
								<CalendarPlus className='size-4' />
								Start next cycle
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setConfirmingUnlock(true)}
								disabled={unlock.isPending}
							>
								<LockOpen className='size-4' />
								Unlock
							</Button>
						</>
					)}
					{isScenario && (
						<Button
							variant='outline'
							size='sm'
							onClick={() =>
								router.push(
									`/demand-planning/compare?planAId=${plan.basePlanId}&planBId=${plan.id}`
								)
							}
							disabled={!plan.basePlanId}
						>
							<GitCompare className='size-4' />
							Compare with base
						</Button>
					)}
					{isScenario && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setConfirmingDuplicate(true)}
						>
							<Copy className='size-4' />
							Duplicate
						</Button>
					)}
					{isScenario && (
						<Button
							variant='outline'
							size='sm'
							onClick={() => setConfirmingPromote(true)}
							disabled={promote.isPending}
						>
							<ArrowUpRight className='size-4' />
							Make base plan
						</Button>
					)}
					{isScenario &&
						(isDraft ? (
							<Button
								size='sm'
								onClick={() => save.mutate(plan.id)}
								disabled={save.isPending}
							>
								<Lock className='size-4' />
								Save scenario
							</Button>
						) : (
							<Button
								size='sm'
								variant='outline'
								onClick={() => reopen.mutate(plan.id)}
								disabled={reopen.isPending}
							>
								<LockOpen className='size-4' />
								Reopen
							</Button>
						))}
				</div>
			</div>

			<DuplicateScenarioDialog
				scenario={plan}
				open={confirmingDuplicate}
				onClose={() => setConfirmingDuplicate(false)}
				onDuplicated={(copy) =>
					router.push(`/demand-planning/scenarios/${copy.id}`)
				}
			/>

			<CustomAlertDialog
				isOpen={confirmingUnlock}
				onClose={() => setConfirmingUnlock(false)}
				title={`Unlock ${plan.name}?`}
				description='It returns to draft and its frozen baseline is discarded, so the forecast projects from live actuals again — its numbers will move before you edit anything. Any Forecast Accuracy score that used this plan changes once it is finalized again.'
				confirmText='Unlock plan'
				isLoading={unlock.isPending}
				onConfirm={() =>
					unlock.mutate(plan.id, {
						onSuccess: () => setConfirmingUnlock(false),
					})
				}
			/>

			<CustomAlertDialog
				isOpen={confirmingRoll}
				onClose={() => setConfirmingRoll(false)}
				title='Start the next cycle from this plan?'
				description='Creates a new draft for the current cycle — or the month after this plan, whichever is later — carrying the same channels, SKUs, forecast methods and price ladder, plus any overrides still ahead of it. This plan is untouched.'
				confirmText='Start next cycle'
				confirmButtonClassName=''
				icon={<CalendarPlus className='size-8 text-primary' />}
				iconBackgroundClassName='bg-primary/10'
				isLoading={rollForward.isPending}
				onConfirm={() =>
					rollForward.mutate(plan.id, {
						onSuccess: (next) => {
							setConfirmingRoll(false);
							router.push(`/demand-planning/workspace/${next.id}`);
						},
					})
				}
			/>

			<CustomAlertDialog
				isOpen={confirmingPromote}
				onClose={() => setConfirmingPromote(false)}
				title={`Make ${plan.name} the base plan?`}
				description='It stops being a scenario and becomes the open draft plan the workspace shows. Only one draft plan may be open at a time.'
				confirmText='Make base plan'
				confirmButtonClassName=''
				icon={<ArrowUpRight className='size-8 text-primary' />}
				iconBackgroundClassName='bg-primary/10'
				isLoading={promote.isPending}
				onConfirm={() =>
					promote.mutate(plan.id, {
						onSuccess: (promoted) => {
							setConfirmingPromote(false);
							router.push(`/demand-planning/workspace/${promoted.id}`);
						},
					})
				}
			/>
		</>
	);
};

/** One block at the card's own height, so the header does not shift. */
export const PlanSummaryCardSkeleton = () => (
	<Skeleton className='h-14 w-full rounded-lg' />
);

export default PlanSummaryCard;
