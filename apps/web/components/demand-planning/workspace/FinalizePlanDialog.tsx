'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FinalizeDemandPlanSchema } from '@repo/schemas';
import type { DemandPlanType, FinalizeDemandPlanInput } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form';
import { Textarea } from '@repo/ui/components/textarea';
import { Check, Lock } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import { useFinalizeDemandPlan, usePlanGrid } from '@/queries';
import { monthsBetween, periodLabel } from '../shared/period';

/**
 * The confirmation for the one action in the module that cannot be undone.
 *
 * It leads with what finalizing preserves rather than what it forbids: the
 * point of a locked plan is that it still reproduces next quarter, and the
 * warning only means something once that is understood.
 */

const PRESERVED = [
	'Forecast values will be locked',
	'Forecast assumptions will be preserved',
	'Pricing context will be preserved',
	'Notes will be locked with the plan',
	'This plan can be used for forecast accuracy',
];

const Fact = ({ label, value }: { label: string; value: string }) => (
	<div className='flex items-baseline justify-between gap-4 text-sm'>
		<span className='text-muted-foreground'>{label}</span>
		<span className='text-right font-medium tabular-nums'>{value}</span>
	</div>
);

export const FinalizePlanDialog = ({
	plan,
	open,
	onClose,
}: {
	plan: DemandPlanType;
	open: boolean;
	onClose: () => void;
}) => {
	const { mutate: finalizePlan, isPending } = useFinalizeDemandPlan(plan.id);

	// Already cached by the grid on this page, so the counts cost nothing and
	// are exactly the numbers being signed off.
	const { data: grid } = usePlanGrid(plan.id);

	const forecastPeriods = (grid?.periods ?? []).filter(
		(period) => period >= (grid?.firstForecastPeriod ?? '')
	);
	const cells = (grid?.series ?? []).flatMap((series) =>
		forecastPeriods.map((period) => series.cells[period])
	);
	const plannedCells = cells.filter((cell) => cell?.planUnits != null).length;
	const overrides = cells.filter((cell) => cell?.isOverride).length;

	const defaults = useCallback(
		(): FinalizeDemandPlanInput => ({ notes: plan.notes ?? '' }),
		[plan.notes]
	);

	const form = useForm<FinalizeDemandPlanInput>({
		resolver: zodResolver(FinalizeDemandPlanSchema),
		defaultValues: defaults(),
	});

	useEffect(() => {
		if (open) form.reset(defaults());
	}, [open, form, defaults]);

	const onSubmit = (values: FinalizeDemandPlanInput) =>
		finalizePlan(values, { onSuccess: () => onClose() });

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
				<DialogHeader>
					<DialogTitle>Finalize {plan.name}?</DialogTitle>
					<DialogDescription>
						This freezes the plan and the actuals it was built on, so it
						reproduces exactly as signed off. It can be unlocked later, but
						doing so discards that snapshot.
					</DialogDescription>
				</DialogHeader>

				<ul className='space-y-2 rounded-lg border p-4'>
					{PRESERVED.map((item) => (
						<li key={item} className='flex items-start gap-2.5 text-sm'>
							<Check className='mt-0.5 size-4 shrink-0 text-green-600' />
							<span>{item}</span>
						</li>
					))}
				</ul>

				<div className='space-y-2'>
					<Fact
						label='Planning horizon'
						value={`${periodLabel(plan.planMonth)} → ${periodLabel(
							plan.horizonEnd
						)} · ${monthsBetween(plan.planMonth, plan.horizonEnd)} months`}
					/>
					<Fact label='Forecast cells' value={String(plannedCells)} />
					<Fact label='Manual overrides' value={String(overrides)} />
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='notes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes — the reasoning behind this plan</FormLabel>
									<FormControl>
										<Textarea
											rows={6}
											placeholder='What drove this cycle — the opportunities and constraints behind the numbers, who was consulted, what was decided, and which assumptions to revisit next month.'
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormDescription>
										Locked with the plan. Nobody can edit this after
										finalization — including you.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								<Lock className='size-4' />
								Finalize plan
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default FinalizePlanDialog;
