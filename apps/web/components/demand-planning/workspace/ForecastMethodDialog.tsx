'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	DEFAULT_FORECAST_METHOD,
	DEFAULT_FORECAST_WINDOW_MONTHS,
} from '@repo/constants';
import type { ChannelEnum } from '@repo/enums';
import { ForecastMethodTypeEnum } from '@repo/enums';
import { SetForecastMethodSchema } from '@repo/schemas';
import type {
	DemandForecastMethodType,
	DemandPlanType,
	SetForecastMethodInput,
	SkuOptionType,
} from '@repo/types';
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
import { cn } from '@repo/ui/lib/utils';
import { projectSeries } from '@repo/utils';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { usePlanGrid, useSetForecastMethod } from '@/queries';
import { FORECAST_METHOD_LABELS, skuLabel } from '../shared/constants';
import { periodLabel } from '../shared/period';

export const ForecastMethodDialog = ({
	plan,
	series,
	sku,
	showComparison = false,
	open,
	onClose,
}: {
	plan: DemandPlanType;
	series: DemandForecastMethodType | null;
	sku?: SkuOptionType;
	/** Shows the statistical-vs-plan breakdown for this series. */
	showComparison?: boolean;
	open: boolean;
	onClose: () => void;
}) => {
	const { mutate: setMethod, isPending } = useSetForecastMethod(plan.id);

	const defaults = useCallback(
		(): SetForecastMethodInput => ({
			channel: (series?.channel ?? '') as ChannelEnum,
			skuSettingId: series?.skuSettingId ?? '',
			method: series?.method ?? DEFAULT_FORECAST_METHOD,
			growthPct: series?.growthPct ?? null,
			windowMonths: series?.windowMonths ?? DEFAULT_FORECAST_WINDOW_MONTHS,
		}),
		[series]
	);

	const form = useForm<SetForecastMethodInput>({
		resolver: zodResolver(SetForecastMethodSchema),
		defaultValues: defaults(),
	});

	useEffect(() => {
		if (open) form.reset(defaults());
	}, [open, form, defaults]);

	// Straight off the grid, which both callers have already loaded.
	const { data: grid } = usePlanGrid(open && showComparison ? plan.id : null);

	const method = form.watch('method');
	const growthPct = form.watch('growthPct');
	const windowMonths = form.watch('windowMonths');

	const comparison = useMemo(() => {
		if (!grid || !series) return [];
		const found = grid.series.find(
			(entry) =>
				entry.channel === series.channel &&
				entry.skuSettingId === series.skuSettingId
		);
		if (!found) return [];

		const forecastPeriods = grid.periods.filter(
			(period) => period >= grid.firstForecastPeriod
		);

		// Re-projected here from the same history the server used, with whatever
		// the form currently holds — so the table previews an unsaved change.
		const history = grid.periods
			.map((period) => {
				const cell = found.cells[period];
				return cell?.actualUnits === null || cell?.actualUnits === undefined
					? null
					: {
							period,
							units: cell.actualUnits,
							isPartial: cell.isPartialActual,
						};
			})
			.filter((point): point is NonNullable<typeof point> => point !== null);

		const projected = projectSeries(
			{ method, growthPct, windowMonths },
			history,
			forecastPeriods
		);

		return forecastPeriods.map((period) => {
			const cell = found.cells[period];
			const statistical = projected.get(period) ?? 0;
			// A typed cell keeps its value; an untouched one follows the preview.
			const plan = cell?.isOverride ? (cell.planUnits ?? 0) : statistical;
			return { period, statistical, plan, delta: plan - statistical };
		});
	}, [grid, series, method, growthPct, windowMonths]);

	const totals = useMemo(
		() =>
			comparison.reduce(
				(acc, line) => ({
					statistical: acc.statistical + line.statistical,
					plan: acc.plan + line.plan,
					delta: acc.delta + line.delta,
				}),
				{ statistical: 0, plan: 0, delta: 0 }
			),
		[comparison]
	);

	const needsGrowth = method === ForecastMethodTypeEnum.STATIC_GROWTH;
	const needsWindow = method === ForecastMethodTypeEnum.HISTORICAL_AVERAGE;

	const onSubmit = (values: SetForecastMethodInput) =>
		setMethod(
			{
				...values,
				growthPct: needsGrowth ? values.growthPct : null,
				windowMonths: needsWindow ? values.windowMonths : null,
			},
			{ onSuccess: () => onClose() }
		);

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Forecast method</DialogTitle>
					<DialogDescription>
						{skuLabel(sku)}
						{series ? ` in ${series.channel}.` : '.'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='method'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Method
										<RequiredStar />
									</FormLabel>
									<Select value={field.value} onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger className='w-full'>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(ForecastMethodTypeEnum).map((value) => (
												<SelectItem key={value} value={value}>
													{FORECAST_METHOD_LABELS[value]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{needsGrowth && (
							<FormField
								control={form.control}
								name='growthPct'
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Monthly growth
											<RequiredStar />
										</FormLabel>
										<FormControl>
											<div className='relative'>
												<Input
													type='number'
													step='0.1'
													className='pr-8'
													value={field.value == null ? '' : field.value * 100}
													onChange={(event) =>
														field.onChange(
															Number.isNaN(event.target.valueAsNumber)
																? null
																: event.target.valueAsNumber / 100
														)
													}
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
											Compounds off the last closed actual, month over month.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{needsWindow && (
							<FormField
								control={form.control}
								name='windowMonths'
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Trailing window
											<RequiredStar />
										</FormLabel>
										<FormControl>
											<div className='relative'>
												<Input
													type='number'
													min={1}
													max={60}
													className='pr-16'
													value={field.value ?? ''}
													onChange={(event) =>
														field.onChange(
															Number.isNaN(event.target.valueAsNumber)
																? null
																: event.target.valueAsNumber
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
												<span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
													months
												</span>
											</div>
										</FormControl>
										<FormDescription>
											Averages that many closed months and holds the level flat.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* What the method produces against what the plan commits to —
						    the gap is everything a planner deliberately changed. */}
						{showComparison && comparison.length > 0 && (
							<div className='space-y-1.5 pt-2'>
								<p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
									Statistical forecast vs business plan
								</p>
								<div className='max-h-56 overflow-y-auto rounded-md border'>
									<table className='w-full text-xs'>
										<thead className='sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]'>
											<tr className='text-muted-foreground'>
												<th className='px-3 py-1.5 text-left font-medium'>
													Month
												</th>
												<th className='px-3 py-1.5 text-right font-medium'>
													Statistical
												</th>
												<th className='px-3 py-1.5 text-right font-medium'>
													Business plan
												</th>
												<th className='px-3 py-1.5 text-right font-medium'>
													Δ
												</th>
											</tr>
										</thead>
										<tbody>
											{comparison.map((line) => (
												<tr
													key={line.period}
													className={cn(
														'border-t',
														line.delta !== 0 && 'bg-amber-50/60'
													)}
												>
													<td className='px-3 py-1.5'>
														{periodLabel(line.period)}
													</td>
													<td className='px-3 py-1.5 text-right tabular-nums'>
														{line.statistical}
													</td>
													<td className='px-3 py-1.5 text-right font-medium tabular-nums'>
														{line.plan}
													</td>
													<td
														className={cn(
															'px-3 py-1.5 text-right tabular-nums',
															line.delta === 0
																? 'text-muted-foreground'
																: 'font-medium'
														)}
													>
														{line.delta > 0 ? `+${line.delta}` : line.delta}
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className='border-t bg-muted/40 font-medium'>
												<td className='px-3 py-1.5'>Total</td>
												<td className='px-3 py-1.5 text-right tabular-nums'>
													{totals.statistical}
												</td>
												<td className='px-3 py-1.5 text-right tabular-nums'>
													{totals.plan}
												</td>
												<td className='px-3 py-1.5 text-right tabular-nums'>
													{totals.delta > 0 ? `+${totals.delta}` : totals.delta}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
								<p className='text-xs text-muted-foreground'>
									Highlighted months carry a manual override.
								</p>
							</div>
						)}

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

export default ForecastMethodDialog;
