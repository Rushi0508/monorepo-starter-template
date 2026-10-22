'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChannelEnum } from '@repo/enums';
import { CreateDemandPlanSchema } from '@repo/schemas';
import type { CreateDemandPlanInput, DemandPlanType } from '@repo/types';
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
import { Label } from '@repo/ui/components/label';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { Textarea } from '@repo/ui/components/textarea';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import {
	useCreateDemandPlan,
	useSkuOptions,
	useUpdateDemandPlan,
} from '@/queries';
import { MonthYearPicker } from '../shared/MonthYearPicker';
import {
	addMonths,
	currentPeriod,
	defaultPlanName,
	monthsBetween,
	periodLabel,
} from '../shared/period';

const CHANNEL_OPTIONS = Object.values(ChannelEnum).map((channel) => ({
	label: channel,
	value: channel,
}));

/**
 * Creating a plan is a deliberate act — plans are not a monthly cycle, and one
 * made now may run for several months.
 *
 * Scope is chosen here rather than afterwards because it decides which pricing
 * is copied into the plan; narrowing it later would leave orphaned ladders.
 */
export const NewPlanDialog = ({
	open,
	onClose,
	plan,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	plan?: DemandPlanType | null;
	/** Called with the new plan, so the caller can navigate to it. */
	onCreated?: (created: DemandPlanType) => void;
}) => {
	const isEdit = !!plan;

	const { mutate: createPlan, isPending: isCreating } = useCreateDemandPlan();
	const { mutate: updatePlan, isPending: isUpdating } = useUpdateDemandPlan(
		plan?.id ?? ''
	);
	const isPending = isCreating || isUpdating;
	const { data: skuOptions = [], isLoading: skusLoading } = useSkuOptions();
	const planMonth = plan?.planMonth ?? currentPeriod();

	const defaults = useCallback(
		() => ({
			name: plan?.name ?? defaultPlanName(planMonth),
			notes: plan?.notes ?? '',
			horizonEnd: plan?.horizonEnd ?? addMonths(planMonth, 11),
			scope: (plan?.channelScopes ?? []).map((entry) => ({
				channel: entry.channel as ChannelEnum,
				skuSettingIds: entry.skuSettingIds,
			})) as CreateDemandPlanInput['scope'],
		}),
		[plan, planMonth]
	);

	const form = useForm<CreateDemandPlanInput>({
		resolver: zodResolver(CreateDemandPlanSchema),
		defaultValues: defaults(),
	});

	useEffect(() => {
		if (open) form.reset(defaults());
	}, [open, form, defaults]);

	const scope = form.watch('scope') ?? [];

	const defaultSkuIds = useMemo(() => {
		const distribution = skuOptions.filter((s) =>
			s.unitType?.toLowerCase().includes('distribution')
		);
		return distribution.map((s) => s.id);
	}, [skuOptions]);

	const seeded = useRef(false);
	useEffect(() => {
		if (!open) {
			seeded.current = false;
			return;
		}
		if (isEdit || seeded.current || skuOptions.length === 0) return;
		seeded.current = true;
		form.setValue(
			'scope',
			Object.values(ChannelEnum).map((channel) => ({
				channel,
				skuSettingIds: defaultSkuIds,
			}))
		);
	}, [open, isEdit, skuOptions.length, defaultSkuIds, form]);

	const skuChoices = skuOptions.map((s) => ({
		label:
			s.title?.trim() && s.title !== s.sku ? `${s.sku} — ${s.title}` : s.sku,
		value: s.id,
	}));

	const selectedChannels = scope.map((entry) => entry.channel);

	const setChannels = (next: string[]) => {
		const chosen = new Set(next);
		form.setValue(
			'scope',
			Object.values(ChannelEnum)
				.filter((channel) => chosen.has(channel))
				.map(
					(channel) =>
						scope.find((entry) => entry.channel === channel) ?? {
							channel,
							skuSettingIds: defaultSkuIds,
						}
				),
			{ shouldValidate: true }
		);
	};

	const setChannelSkus = (channel: string, skuSettingIds: string[]) =>
		form.setValue(
			'scope',
			scope.map((entry) =>
				entry.channel === channel ? { ...entry, skuSettingIds } : entry
			),
			{ shouldValidate: true }
		);

	const onSubmit = (values: CreateDemandPlanInput) =>
		isEdit
			? updatePlan(values, { onSuccess: () => onClose() })
			: createPlan(values, {
					onSuccess: (created) => {
						onClose();
						onCreated?.(created);
					},
				});

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='sm:max-w-xl'>
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit plan' : 'New demand plan'}</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Scope, thresholds and forecast methods are changed from the configuration panel.'
							: `Forecasting starts at ${periodLabel(planMonth)}. Thresholds and forecast methods are set afterwards from the configuration panel.`}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Not a form field — it is fixed at creation and never submitted,
						    so it uses a plain label rather than borrowing FormLabel. */}
						<div className='space-y-2'>
							<Label htmlFor='forecast-starts'>Forecast starts</Label>
							<Input
								id='forecast-starts'
								value={periodLabel(planMonth)}
								readOnly
								disabled
							/>
							<p className='text-sm text-muted-foreground'>
								Fixed at creation — it is the line between settled actuals and
								forecast.
							</p>
						</div>

						<FormField
							control={form.control}
							name='horizonEnd'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Horizon ends
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<MonthYearPicker
											value={field.value}
											onChange={field.onChange}
											min={planMonth}
										/>
									</FormControl>
									<FormDescription>
										{monthsBetween(planMonth, field.value)} months ·{' '}
										{periodLabel(planMonth)} → {periodLabel(field.value)}. Can
										be changed later.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='scope'
							render={() => (
								<FormItem>
									<FormLabel>
										Channels
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<MultiSelect
											options={CHANNEL_OPTIONS}
											defaultValue={selectedChannels}
											onValueChange={setChannels}
											placeholder='Select channels'
											maxCount={4}
										/>
									</FormControl>
									<FormDescription>
										Each channel sells its own SKUs — pick them per channel
										below. Their current pricing is copied into the plan on
										creation.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* One row per chosen channel. Nested inside the same scope field,
						    so a channel left with no SKUs surfaces on the field above. */}
						{scope.length > 0 && (
							<div className='space-y-3 rounded-lg border p-3'>
								{scope.map((entry) => (
									<div key={entry.channel} className='space-y-1.5'>
										<div className='flex items-baseline justify-between gap-2'>
											<Label
												htmlFor={`scope-${entry.channel}`}
												className='text-sm'
											>
												{entry.channel}
											</Label>
											<span className='text-xs text-muted-foreground'>
												{entry.skuSettingIds.length} of {skuOptions.length} SKUs
											</span>
										</div>
										<MultiSelect
											id={`scope-${entry.channel}`}
											options={skuChoices}
											defaultValue={entry.skuSettingIds}
											onValueChange={(values) =>
												setChannelSkus(entry.channel, values)
											}
											placeholder={
												skusLoading ? 'Loading SKUs…' : 'Select SKUs'
											}
											maxCount={2}
										/>
									</div>
								))}
							</div>
						)}

						<FormField
							control={form.control}
							name='notes'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder='What is this plan for?'
											{...field}
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
							<LoadingButton
								type='submit'
								isLoading={isPending}
								disabled={isPending || !form.formState.isValid}
							>
								{isEdit ? 'Save changes' : 'Create plan'}
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default NewPlanDialog;
