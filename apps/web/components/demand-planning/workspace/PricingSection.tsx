'use client';

import type { DemandPlanType, SkuOptionType } from '@repo/types';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePlanPricing, useRemovePlanPricing, useSkuOptions } from '@/queries';
import { AddPricingDialog, type PricingKind } from './AddPricingDialog';

const money = (amount: number) =>
	amount.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	});

const dateLabel = (value: Date | string) =>
	format(new Date(value), 'd MMM yyyy');

type PriceVersion = {
	id: string;
	amount: number;
	effectiveFrom: Date | string;
};

const dateKey = (value: Date | string) => format(new Date(value), 'yyyy-MM-dd');

/**
 * Splits a ladder the way SKU settings does: what takes effect later, what is
 * in force now, and what it replaced. Only the first two matter day to day, so
 * history stays folded away and a long ladder cannot swamp the panel.
 */
function splitVersions(rows: PriceVersion[]) {
	const today = dateKey(new Date());
	const scheduled = rows.filter((row) => dateKey(row.effectiveFrom) > today);
	const past = rows.filter((row) => dateKey(row.effectiveFrom) <= today);
	return { scheduled, current: past[0] ?? null, history: past.slice(1) };
}

const VersionRow = ({
	version,
	tag,
	isEditable,
	onRemove,
}: {
	version: PriceVersion;
	tag?: string;
	isEditable: boolean;
	onRemove: (versionId: string) => void;
}) => (
	<li className='flex items-center justify-between gap-2 text-xs'>
		<span className='tabular-nums'>
			{money(version.amount)}
			<span className='ml-1.5 text-muted-foreground'>
				from {dateLabel(version.effectiveFrom)}
				{tag ? ` · ${tag}` : ''}
			</span>
		</span>
		{isEditable && (
			<Button
				type='button'
				variant='ghost'
				size='icon'
				className='size-6 text-muted-foreground hover:text-destructive'
				aria-label={`Remove the version from ${dateLabel(version.effectiveFrom)}`}
				onClick={() => onRemove(version.id)}
			>
				<Trash2 className='size-3' />
			</Button>
		)}
	</li>
);

const ToggleLine = ({
	isOpen,
	onToggle,
	label,
}: {
	isOpen: boolean;
	onToggle: () => void;
	label: string;
}) => (
	<Button
		type='button'
		variant='ghost'
		size='sm'
		className='h-auto px-0! text-xs text-muted-foreground hover:bg-transparent'
		aria-expanded={isOpen}
		onClick={onToggle}
	>
		{label}
		<ChevronDown
			className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')}
		/>
	</Button>
);

const Ladder = ({
	title,
	versions,
	isEditable,
	onAdd,
	onRemove,
}: {
	title: string;
	versions: PriceVersion[];
	isEditable: boolean;
	onAdd: () => void;
	onRemove: (versionId: string) => void;
}) => {
	const [showHistory, setShowHistory] = useState(false);
	const [showScheduled, setShowScheduled] = useState(false);
	const { scheduled, current, history } = splitVersions(versions);

	return (
		<div className='space-y-1'>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-xs font-medium'>{title}</p>
				{isEditable && (
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='h-auto px-1 py-0.5 text-xs text-muted-foreground'
						onClick={onAdd}
					>
						<Plus className='size-3.5' />
						Add
					</Button>
				)}
			</div>

			{versions.length === 0 ? (
				<p className='text-xs text-muted-foreground'>Nothing set.</p>
			) : (
				<div className='space-y-0.5'>
					{/* Scheduled sits above what is in force and history below it, so the
					    column reads forward in time from the top. */}
					{scheduled.length > 0 && (
						<>
							<ToggleLine
								isOpen={showScheduled}
								onToggle={() => setShowScheduled((open) => !open)}
								label={
									showScheduled
										? 'Hide scheduled'
										: `${scheduled.length} scheduled`
								}
							/>
							{showScheduled && (
								<ul className='space-y-0.5'>
									{scheduled.map((version) => (
										<VersionRow
											key={version.id}
											version={version}
											tag='scheduled'
											isEditable={isEditable}
											onRemove={onRemove}
										/>
									))}
								</ul>
							)}
						</>
					)}

					{current && (
						<ul>
							<VersionRow
								version={current}
								tag='in force'
								isEditable={isEditable}
								onRemove={onRemove}
							/>
						</ul>
					)}

					{history.length > 0 && (
						<>
							<ToggleLine
								isOpen={showHistory}
								onToggle={() => setShowHistory((open) => !open)}
								label={
									showHistory
										? 'Hide earlier versions'
										: `${history.length} earlier version${history.length === 1 ? '' : 's'}`
								}
							/>
							{showHistory && (
								<ul className='space-y-0.5'>
									{history.map((version) => (
										<VersionRow
											key={version.id}
											version={version}
											isEditable={isEditable}
											onRemove={onRemove}
										/>
									))}
								</ul>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
};

export const PricingSection = ({
	plan,
	isEditable,
}: {
	plan: DemandPlanType;
	isEditable: boolean;
}) => {
	const { data: pricing, isLoading } = usePlanPricing(plan.id);
	const { data: skuOptions = [] } = useSkuOptions();
	const { mutate: removeVersion } = useRemovePlanPricing(plan.id);

	const [adding, setAdding] = useState<{
		kind: PricingKind;
		skuSettingId: string;
		channel?: string;
	} | null>(null);

	const skuById = useMemo(
		() => new Map(skuOptions.map((option) => [option.id, option])),
		[skuOptions]
	);

	/** Every SKU in scope, with the channels that sell it. */
	const skus = useMemo(() => {
		const channelsBySku = new Map<string, string[]>();
		for (const scope of plan.channelScopes) {
			for (const skuSettingId of scope.skuSettingIds) {
				channelsBySku.set(skuSettingId, [
					...(channelsBySku.get(skuSettingId) ?? []),
					scope.channel,
				]);
			}
		}
		return [...channelsBySku.entries()];
	}, [plan.channelScopes]);

	const label = (sku?: SkuOptionType) =>
		sku?.title?.trim() && sku.title !== sku.sku ? sku.title : (sku?.sku ?? '');

	return (
		<section className='space-y-3'>
			<h3 className='text-sm font-medium'>Pricing and cost</h3>
			<p className='text-xs text-muted-foreground'>
				The plan's own copy, taken from SKU settings when it was created — so a
				later settings edit cannot move this plan's revenue. A new version
				applies from its date forward and never changes a month already priced.
			</p>

			{isLoading && (
				<div className='space-y-2'>
					<Skeleton className='h-20 w-full rounded-md' />
					<Skeleton className='h-20 w-full rounded-md' />
				</div>
			)}

			{!isLoading && skus.length === 0 && (
				<p className='text-xs text-muted-foreground'>Nothing in scope yet.</p>
			)}

			{!isLoading && pricing && (
				<Accordion type='multiple' className='space-y-2'>
					{skus.map(([skuSettingId, channels]) => {
						const sku = skuById.get(skuSettingId);

						return (
							<AccordionItem
								key={skuSettingId}
								value={skuSettingId}
								className='rounded-md border px-3'
							>
								<AccordionTrigger className='py-2.5 hover:no-underline'>
									<span className='flex items-center gap-1 truncate text-xs font-medium'>
										{label(sku) || 'Unknown SKU'}
										{sku?.title && sku.title !== sku.sku && (
											<span className='truncate font-normal text-muted-foreground'>
												- {sku.sku}
											</span>
										)}
									</span>
								</AccordionTrigger>

								<AccordionContent className='space-y-4 border-t pb-3 pt-3'>
									<Ladder
										title='Cost of goods'
										versions={pricing.cogs.filter(
											(row) => row.skuSettingId === skuSettingId
										)}
										isEditable={isEditable}
										onAdd={() => setAdding({ kind: 'cogs', skuSettingId })}
										onRemove={(versionId) =>
											removeVersion({ kind: 'cogs', versionId })
										}
									/>

									{channels.map((channel) => (
										<div key={channel} className='space-y-2'>
											<Badge variant='secondary' className='text-[10px]'>
												{channel}
											</Badge>

											<Ladder
												title='Price'
												versions={pricing.channelPrices.filter(
													(row) =>
														row.skuSettingId === skuSettingId &&
														row.channel === channel
												)}
												isEditable={isEditable}
												onAdd={() =>
													setAdding({
														kind: 'channel-price',
														skuSettingId,
														channel,
													})
												}
												onRemove={(versionId) =>
													removeVersion({ kind: 'channel-price', versionId })
												}
											/>

											<Ladder
												title='Fulfillment cost'
												versions={pricing.channelFulfillmentCosts.filter(
													(row) =>
														row.skuSettingId === skuSettingId &&
														row.channel === channel
												)}
												isEditable={isEditable}
												onAdd={() =>
													setAdding({
														kind: 'channel-fulfillment-cost',
														skuSettingId,
														channel,
													})
												}
												onRemove={(versionId) =>
													removeVersion({
														kind: 'channel-fulfillment-cost',
														versionId,
													})
												}
											/>
										</div>
									))}
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			)}

			{adding && (
				<AddPricingDialog
					planId={plan.id}
					kind={adding.kind}
					skuSettingId={adding.skuSettingId}
					channel={adding.channel}
					skuLabel={label(skuById.get(adding.skuSettingId))}
					open
					onClose={() => setAdding(null)}
				/>
			)}
		</section>
	);
};

export default PricingSection;
