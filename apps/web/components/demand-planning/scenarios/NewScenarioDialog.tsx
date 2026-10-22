'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DemandPlanKindEnum } from '@repo/enums';
import { CreateDemandScenarioSchema } from '@repo/schemas';
import type { CreateDemandScenarioInput, DemandPlanType } from '@repo/types';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { useCreateScenario, useDemandPlans } from '@/queries';
import { periodLabel } from '../shared/period';

export const NewScenarioDialog = ({
	open,
	onClose,
	defaultBasePlanId,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	defaultBasePlanId?: string;
	onCreated?: (scenario: DemandPlanType) => void;
}) => {
	const { data: plans = [] } = useDemandPlans();
	const { mutate: createScenario, isPending } = useCreateScenario();

	const basePlans = plans
		.filter((plan) => plan.kind === DemandPlanKindEnum.BASE)
		.sort((a, b) => b.planMonth.localeCompare(a.planMonth));

	const defaults = useCallback(
		(): CreateDemandScenarioInput => ({
			basePlanId: defaultBasePlanId ?? basePlans[0]?.id ?? '',
			name: '',
			notes: '',
		}),
		[defaultBasePlanId, basePlans[0]?.id]
	);

	const form = useForm<CreateDemandScenarioInput>({
		resolver: zodResolver(CreateDemandScenarioSchema),
		defaultValues: defaults(),
	});

	useEffect(() => {
		if (open) form.reset(defaults());
	}, [open, form, defaults]);

	const onSubmit = (values: CreateDemandScenarioInput) =>
		createScenario(values, {
			onSuccess: (scenario) => {
				onClose();
				onCreated?.(scenario);
			},
		});

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>New scenario</DialogTitle>
					<DialogDescription>
						A scenario is a full copy of a plan — its scope, forecast methods,
						overrides and price ladder. Editing it never touches the plan it
						came from.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='basePlanId'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Fork from
										<RequiredStar />
									</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger className='w-full'>
												<SelectValue placeholder='Pick a plan' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{basePlans.map((plan) => (
												<SelectItem key={plan.id} value={plan.id}>
													{plan.name} · {periodLabel(plan.planMonth)} →{' '}
													{periodLabel(plan.horizonEnd)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										The scenario inherits this plan's horizon and scope.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Name
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input placeholder='Walmart — October rollout' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='notes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder='What this scenario is pricing, and which assumptions differ from the plan.'
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								Create scenario
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default NewScenarioDialog;
