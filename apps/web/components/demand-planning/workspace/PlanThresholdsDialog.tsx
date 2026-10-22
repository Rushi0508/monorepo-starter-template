'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DemandPlanThresholdsSchema } from '@repo/schemas';
import type { DemandPlanThresholdsInput, DemandPlanType } from '@repo/types';
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
import { Input } from '@repo/ui/components/input';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { useUpdateDemandPlan } from '@/queries';

/**
 * Thresholds are stored as 0–1 ratios but typed as whole percents, so the field
 * converts on the way in and out rather than the schema carrying two units.
 */
const toPercent = (ratio: number) => Math.round(ratio * 100);

export const PlanThresholdsDialog = ({
	plan,
	open,
	onClose,
}: {
	plan: DemandPlanType;
	open: boolean;
	onClose: () => void;
}) => {
	const { mutate: updatePlan, isPending } = useUpdateDemandPlan(plan.id);

	const defaults = useCallback(
		(): DemandPlanThresholdsInput => ({
			flagOverrideAbovePct: plan.flagOverrideAbovePct,
			requireReasonAbovePct: plan.requireReasonAbovePct,
		}),
		[plan.flagOverrideAbovePct, plan.requireReasonAbovePct]
	);

	const form = useForm<DemandPlanThresholdsInput>({
		resolver: zodResolver(DemandPlanThresholdsSchema),
		defaultValues: defaults(),
	});

	useEffect(() => {
		if (open) form.reset(defaults());
	}, [open, form, defaults]);

	const onSubmit = (values: DemandPlanThresholdsInput) =>
		updatePlan(values, { onSuccess: () => onClose() });

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Override thresholds</DialogTitle>
					<DialogDescription>
						How far a typed number may sit from the statistical forecast before
						the grid reacts. Neither threshold blocks an override.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='flagOverrideAbovePct'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Flag above
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<div className='relative'>
											<Input
												type='number'
												min={0}
												max={100}
												className='pr-8'
												value={
													field.value == null ? '' : toPercent(field.value)
												}
												onChange={(event) => {
													const value = event.target.value;

													if (value.trim() === '') {
														field.onChange(null);
														return;
													}

													field.onChange(Number(value) / 100);
												}}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
											<span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
												%
											</span>
										</div>
									</FormControl>
									<FormDescription>
										Marks the cell with a warning so a reviewer can see it.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='requireReasonAbovePct'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Require reason above
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<div className='relative'>
											<Input
												type='number'
												min={0}
												max={100}
												className='pr-8'
												value={
													field.value == null ? '' : toPercent(field.value)
												}
												onChange={(event) => {
													const value = event.target.value;

													if (value.trim() === '') {
														field.onChange(null);
														return;
													}

													field.onChange(Number(value) / 100);
												}}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
											<span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
												%
											</span>
										</div>
									</FormControl>
									<FormDescription>
										Demands a reason before the edit is accepted, with an
										optional note.
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
								Save changes
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default PlanThresholdsDialog;
