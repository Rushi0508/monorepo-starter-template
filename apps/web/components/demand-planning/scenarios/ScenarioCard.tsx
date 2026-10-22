'use client';

import { DemandPlanStatusEnum } from '@repo/enums';
import type { DemandScenarioListItemType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { formatCurrency } from '@repo/utils';
import { Copy, GitCompare, PencilLine, ScanEye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlanStatusBadge } from '../shared/PlanBadges';
import { monthsBetween, periodLabel } from '../shared/period';
import { DuplicateScenarioDialog } from './DuplicateScenarioDialog';

const Stat = ({ label, value }: { label: string; value: string }) => (
	<div>
		<p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
			{label}
		</p>
		<p className='mt-0.5 text-sm font-medium tabular-nums'>{value}</p>
	</div>
);

export const ScenarioCard = ({
	scenario,
}: {
	scenario: DemandScenarioListItemType;
}) => {
	const router = useRouter();
	const [confirmingDuplicate, setConfirmingDuplicate] = useState(false);

	const isSaved = scenario.status === DemandPlanStatusEnum.SAVED;
	const open = () => router.push(`/demand-planning/scenarios/${scenario.id}`);

	return (
		<>
			<div className='flex flex-col gap-3 rounded-lg border bg-card p-4'>
				<button
					type='button'
					onClick={open}
					className='flex flex-col items-start gap-1.5 text-left'
				>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{scenario.name}</span>
						<PlanStatusBadge status={scenario.status} kind={scenario.kind} />
					</div>
					<p className='text-xs text-muted-foreground'>
						from {scenario.basePlanName ?? 'a deleted plan'} ·{' '}
						{periodLabel(scenario.planMonth)} →{' '}
						{periodLabel(scenario.horizonEnd)} ·{' '}
						{monthsBetween(scenario.planMonth, scenario.horizonEnd)} months
					</p>
				</button>

				{scenario.notes?.trim() && (
					<p className='line-clamp-2 text-xs text-muted-foreground'>
						{scenario.notes}
					</p>
				)}

				<div className='grid grid-cols-3 gap-3 border-t pt-3'>
					<Stat
						label='Cases'
						value={scenario.totalCases.toLocaleString('en-US')}
					/>
					<Stat label='Revenue' value={formatCurrency(scenario.totalRevenue)} />
					<Stat label='Overrides' value={String(scenario.overrideCount)} />
				</div>

				<div className='flex flex-wrap items-center gap-2'>
					<Button size='sm' onClick={open}>
						{isSaved ? (
							<ScanEye className='size-4' />
						) : (
							<PencilLine className='size-4' />
						)}
						{isSaved ? 'Review' : 'Continue editing'}
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={() => setConfirmingDuplicate(true)}
					>
						<Copy className='size-4' />
						Duplicate
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={() =>
							router.push(
								`/demand-planning/compare?planAId=${scenario.basePlanId}&planBId=${scenario.id}`
							)
						}
						disabled={!scenario.basePlanId}
					>
						<GitCompare className='size-4' />
						Compare with base
					</Button>
				</div>
			</div>

			<DuplicateScenarioDialog
				scenario={scenario}
				open={confirmingDuplicate}
				onClose={() => setConfirmingDuplicate(false)}
			/>
		</>
	);
};

export default ScenarioCard;
