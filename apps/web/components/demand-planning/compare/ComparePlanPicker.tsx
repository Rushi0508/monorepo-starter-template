'use client';

import { tooltips } from '@repo/constants';
import { DemandPlanKindEnum } from '@repo/enums';
import type { DemandComparisonType, DemandPlanListItemType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import CustomTooltip from '@/components/general/CustomTooltip';
import { FilterField } from '../shared/FilterField';
import { periodLabelShort } from '../shared/period';

interface PlanSelectProps {
	label: string;
	value?: string;
	plans: DemandPlanListItemType[];
	onChange: (planId: string) => void;
}

function PlanSelect({ label, value, plans, onChange }: PlanSelectProps) {
	const basePlans = plans.filter(
		(plan) => plan.kind === DemandPlanKindEnum.BASE
	);
	const scenarios = plans.filter(
		(plan) => plan.kind === DemandPlanKindEnum.SCENARIO
	);

	return (
		<FilterField label={label}>
			<Select value={value ?? ''} onValueChange={onChange}>
				<SelectTrigger className='w-65 text-xs'>
					<SelectValue placeholder='Pick a plan' />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel className='text-xs'>Plans</SelectLabel>
						{basePlans.map((plan) => (
							<SelectItem key={plan.id} value={plan.id} className='text-xs'>
								{plan.name}
							</SelectItem>
						))}
					</SelectGroup>

					{scenarios.length > 0 && (
						<SelectGroup>
							<SelectLabel className='text-xs'>Scenarios</SelectLabel>
							{scenarios.map((plan) => (
								<SelectItem key={plan.id} value={plan.id} className='text-xs'>
									{plan.name}
								</SelectItem>
							))}
						</SelectGroup>
					)}
				</SelectContent>
			</Select>
		</FilterField>
	);
}

interface ComparePlanPickerProps {
	plans: DemandPlanListItemType[];
	planAId?: string;
	planBId?: string;
	onChange: (next: { planAId?: string; planBId?: string }) => void;
	comparison?: DemandComparisonType;
}

export function ComparePlanPicker({
	plans,
	planAId,
	planBId,
	onChange,
	comparison,
}: ComparePlanPickerProps) {
	const sharedMonths = comparison?.periods.length ?? 0;
	const scope = comparison?.scopeDiff;
	const scopeNote = [
		scope?.added ? `${scope.added} added` : null,
		scope?.dropped ? `${scope.dropped} dropped` : null,
	].filter(Boolean);

	return (
		<div className='space-y-3 border-b pb-4'>
			<div className='flex flex-wrap items-end gap-3'>
				<PlanSelect
					label='Baseline (A)'
					value={planAId}
					plans={plans}
					onChange={(id) => onChange({ planAId: id, planBId })}
				/>

				<Button
					variant='ghost'
					size='sm'
					className='h-9 text-xs text-muted-foreground'
					onClick={() => onChange({ planAId: planBId, planBId: planAId })}
					disabled={!planAId || !planBId}
				>
					<ArrowLeftRight className='size-3.5' />
					Swap
				</Button>

				<PlanSelect
					label='Compared (B)'
					value={planBId}
					plans={plans}
					onChange={(id) => onChange({ planAId, planBId: id })}
				/>
			</div>

			{comparison && sharedMonths > 0 && (
				<div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
					<span className='font-medium text-foreground'>
						{comparison.planA.name}
					</span>
					<ArrowRight className='size-3.5' />
					<span className='font-medium text-foreground'>
						{comparison.planB.name}
					</span>
					<span aria-hidden>·</span>
					<span className='flex items-center gap-1'>
						Comparing {sharedMonths} shared month
						{sharedMonths === 1 ? '' : 's'},{' '}
						{periodLabelShort(comparison.periods[0] ?? '')} –{' '}
						{periodLabelShort(comparison.periods[sharedMonths - 1] ?? '')}
						<CustomTooltip
							content={tooltips.demandPlanningPage.sharedHorizon}
						/>
					</span>
					{scopeNote.length > 0 && (
						<>
							<span aria-hidden>·</span>
							<span>Scope differs: {scopeNote.join(', ')}</span>
						</>
					)}
				</div>
			)}
		</div>
	);
}
