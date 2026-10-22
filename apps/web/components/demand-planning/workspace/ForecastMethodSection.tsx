'use client';

import type { DemandForecastMethodType, DemandPlanType } from '@repo/types';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForecastMethods, useSkuOptions } from '@/queries';
import { FORECAST_METHOD_LABELS } from '../shared/constants';
import { ForecastMethodDialog } from './ForecastMethodDialog';
import { SectionHeading } from './SectionHeading';

/** "Static growth · 5%/mo", "Historical average · 6 mo", "Hard entry". */
const describe = (series: DemandForecastMethodType): string => {
	const label = FORECAST_METHOD_LABELS[series.method];
	if (series.growthPct != null) {
		return `${label} · ${Math.round(series.growthPct * 1000) / 10}%/mo`;
	}
	if (series.windowMonths != null)
		return `${label} · ${series.windowMonths} mo`;
	return label;
};

export const ForecastMethodSection = ({
	plan,
	isEditable,
}: {
	plan: DemandPlanType;
	isEditable: boolean;
}) => {
	const { data: series = [], isLoading } = useForecastMethods(plan.id);
	const { data: skuOptions = [] } = useSkuOptions();

	const [editing, setEditing] = useState<DemandForecastMethodType | null>(null);

	const skuById = useMemo(
		() => new Map(skuOptions.map((option) => [option.id, option])),
		[skuOptions]
	);

	const byChannel = useMemo(() => {
		const groups = new Map<string, DemandForecastMethodType[]>();
		for (const row of series) {
			groups.set(row.channel, [...(groups.get(row.channel) ?? []), row]);
		}
		return [...groups.entries()];
	}, [series]);

	return (
		<section className='space-y-1'>
			<SectionHeading title='Forecast method' />
			<p className='text-xs text-muted-foreground'>
				How the statistical baseline is built for each channel and SKU.
			</p>

			{isLoading && (
				<div className='space-y-2'>
					<Skeleton className='h-20 w-full rounded-md' />
					<Skeleton className='h-20 w-full rounded-md' />
				</div>
			)}

			{!isLoading && byChannel.length === 0 && (
				<p className='text-xs text-muted-foreground'>
					Nothing in scope to forecast yet.
				</p>
			)}

			<Accordion type='multiple' className='space-y-2 mt-3'>
				{byChannel.map(([channel, rows]) => (
					<AccordionItem
						key={channel}
						value={channel}
						className='rounded-md border px-3'
					>
						<AccordionTrigger className='py-2.5 hover:no-underline'>
							<span className='flex items-center gap-2 text-xs font-medium'>
								{channel}
								<Badge variant='outline' className='px-1 py-0 text-[10px]'>
									{rows.length}
								</Badge>
								{/* Says at a glance whether this channel has been tuned at all. */}
							</span>
						</AccordionTrigger>

						<AccordionContent className='pb-2'>
							<ul className='divide-y border-t'>
								{rows.map((row) => {
									const sku = skuById.get(row.skuSettingId);

									return (
										<li
											key={row.skuSettingId}
											className='flex items-center justify-between gap-2 py-2'
										>
											<div className='min-w-0'>
												<p className='flex items-center gap-1 truncate text-xs font-medium'>
													{sku?.title?.trim() || sku?.sku || 'Unknown SKU'}
													{sku?.title && sku.title !== sku.sku && (
														<span className='truncate text-xs font-normal text-muted-foreground'>
															- {sku.sku}
														</span>
													)}
												</p>
												<p className='mt-0.5 text-xs text-muted-foreground'>
													{describe(row)}
												</p>
											</div>

											{isEditable && (
												<div className='flex shrink-0 items-center'>
													<Button
														type='button'
														variant='ghost'
														size='icon'
														className='text-muted-foreground'
														aria-label={`Edit ${sku?.sku ?? 'SKU'} in ${channel}`}
														onClick={() => setEditing(row)}
													>
														<Pencil className='size-3.5' />
													</Button>
												</div>
											)}
										</li>
									);
								})}
							</ul>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>

			<ForecastMethodDialog
				plan={plan}
				series={editing}
				sku={editing ? skuById.get(editing.skuSettingId) : undefined}
				open={!!editing}
				onClose={() => setEditing(null)}
			/>
		</section>
	);
};

export default ForecastMethodSection;
