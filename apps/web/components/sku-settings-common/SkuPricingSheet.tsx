'use client';

import { ChannelEnum } from '@repo/enums';
import type {
	SkuChannelFulfillmentCostType,
	SkuChannelPriceType,
	SkuCogsType,
	SkuMsrpType,
} from '@repo/types';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { DocLink } from '@/components/general/DocLink';
import {
	useAddChannelFulfillmentCost,
	useAddChannelPrice,
	useAddCogs,
	useAddMsrp,
	useDeleteChannelFulfillmentCost,
	useDeleteChannelPrice,
	useDeleteCogs,
	useDeleteMsrp,
	useSkuPricing,
} from '@/queries';

const CHANNELS = Object.values(ChannelEnum);

type CostPart = { readonly key: string; readonly label: string };

/** COGS is entered as these parts; shipping here is inbound, to the warehouse. */
const COGS_PARTS = [
	{ key: 'materials', label: 'Materials' },
	{ key: 'production', label: 'Production' },
	{ key: 'shipping', label: 'Shipping' },
] as const;

/** Fulfillment is entered per channel; shipping here is outbound, to the customer. */
const FULFILLMENT_PARTS = [
	{ key: 'storage', label: 'Storage' },
	{ key: 'pick', label: 'Pick' },
	{ key: 'pack', label: 'Pack' },
	{ key: 'shipping', label: 'Shipping' },
] as const;

type PartKey<P extends readonly CostPart[]> = P[number]['key'];

const todayKey = () => format(new Date(), 'yyyy-MM-dd');

const money = (amount: number) =>
	amount.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
	});

const dateLabel = (value: Date | string) =>
	format(new Date(value), 'd MMM yyyy');

/** Blank reads as 0 so a cost with an unused part can be left empty. */
const toAmount = (value: string) => (value.trim() === '' ? 0 : Number(value));

const isAmount = (value: string) => {
	const parsed = toAmount(value);
	return Number.isFinite(parsed) && parsed >= 0;
};

type PriceVersion = {
	id: string;
	amount: number;
	effectiveFrom: Date | string;
};

function splitVersions<T extends PriceVersion>(rows: T[]) {
	const today = todayKey();
	const scheduled = rows.filter(
		(r) => format(new Date(r.effectiveFrom), 'yyyy-MM-dd') > today
	);
	const past = rows.filter(
		(r) => format(new Date(r.effectiveFrom), 'yyyy-MM-dd') <= today
	);
	return { scheduled, current: past[0] ?? null, history: past.slice(1) };
}

/** Each channel's versions, split the same way as a single ladder. */
function byChannel<T extends PriceVersion & { channel: string }>(rows: T[]) {
	return CHANNELS.map((channel) => {
		const channelRows = rows.filter((row) => row.channel === channel);
		return { channel, rows: channelRows, ...splitVersions(channelRows) };
	});
}

const withScheduled = (label: string, scheduled: number) =>
	scheduled > 0 ? `${label} · ${scheduled} scheduled` : label;

const countScheduled = (groups: { scheduled: unknown[] }[]) =>
	groups.reduce((count, group) => count + group.scheduled.length, 0);

interface AddVersionFormProps {
	onSubmit: (amount: number, effectiveFrom: string) => void;
	isPending: boolean;
	label: string;
}

function AddVersionForm({ onSubmit, isPending, label }: AddVersionFormProps) {
	const [amount, setAmount] = useState('');
	const [effectiveFrom, setEffectiveFrom] = useState(todayKey());

	const parsed = Number(amount);
	const canSubmit =
		amount.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;

	return (
		<div className='flex items-end gap-2'>
			<div className='flex-1 space-y-1'>
				<Label className='text-xs text-muted-foreground'>{label}</Label>
				<Input
					type='number'
					min={0}
					step={0.01}
					placeholder='0.00'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className='h-8'
				/>
			</div>
			<div className='flex-1 space-y-1'>
				<Label className='text-xs text-muted-foreground'>Effective from</Label>
				<Input
					type='date'
					value={effectiveFrom}
					onChange={(e) => setEffectiveFrom(e.target.value)}
					className='h-8'
				/>
			</div>
			<Button
				size='sm'
				className='h-8'
				disabled={!canSubmit || isPending}
				onClick={() => {
					onSubmit(parsed, effectiveFrom);
					setAmount('');
				}}
			>
				<Plus className='h-4 w-4' />
				Add
			</Button>
		</div>
	);
}

interface AddCostPartsFormProps<P extends readonly CostPart[]> {
	parts: P;
	title: string;
	totalLabel: string;
	isPending: boolean;
	/** The version in force, so a one-part change does not mean retyping the rest. */
	current: Record<PartKey<P>, number> | null;
	onSubmit: (values: Record<PartKey<P>, number>, effectiveFrom: string) => void;
}

/** A cost entered as its parts; the total shown is what the server will store. */
function AddCostPartsForm<P extends readonly CostPart[]>({
	parts,
	title,
	totalLabel,
	isPending,
	current,
	onSubmit,
}: AddCostPartsFormProps<P>) {
	type Key = PartKey<P>;

	const blank = () =>
		Object.fromEntries(parts.map((part) => [part.key, ''])) as Record<
			Key,
			string
		>;

	const [values, setValues] = useState<Record<Key, string>>(blank);
	const [effectiveFrom, setEffectiveFrom] = useState(todayKey());

	const entered = parts.map((part) => values[part.key as Key]);
	const allValid = entered.every(isAmount);
	const anyEntered = entered.some((value) => value.trim() !== '');
	const total = allValid
		? entered.reduce((sum, value) => sum + toAmount(value), 0)
		: 0;

	const prefillFromCurrent = () => {
		if (!current) return;
		setValues(
			Object.fromEntries(
				parts.map((part) => [part.key, String(current[part.key as Key])])
			) as Record<Key, string>
		);
	};

	const submit = () => {
		onSubmit(
			Object.fromEntries(
				parts.map((part) => [part.key, toAmount(values[part.key as Key])])
			) as Record<Key, number>,
			effectiveFrom
		);
		setValues(blank());
	};

	return (
		<div className='space-y-2 rounded-lg border border-dashed p-3'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-medium text-muted-foreground'>{title}</p>
				{current && (
					<button
						type='button'
						onClick={prefillFromCurrent}
						className='text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
					>
						Copy current
					</button>
				)}
			</div>

			<div
				className={cn(
					'grid gap-2',
					parts.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
				)}
			>
				{parts.map((part) => (
					<div key={part.key} className='space-y-1'>
						<Label className='text-xs text-muted-foreground'>
							{part.label} ($)
						</Label>
						<Input
							type='number'
							min={0}
							step={0.01}
							placeholder='0.00'
							value={values[part.key as Key]}
							onChange={(e) =>
								setValues(
									(prev) =>
										({ ...prev, [part.key]: e.target.value }) as Record<
											Key,
											string
										>
								)
							}
							className='h-8'
						/>
					</div>
				))}
			</div>

			<div className='flex items-end gap-2'>
				<div className='flex-1 space-y-1'>
					<Label className='text-xs text-muted-foreground'>
						Effective from
					</Label>
					<Input
						type='date'
						value={effectiveFrom}
						onChange={(e) => setEffectiveFrom(e.target.value)}
						className='h-8'
					/>
				</div>
				<div className='flex-1 space-y-1'>
					<Label className='text-xs text-muted-foreground'>{totalLabel}</Label>
					<p className='flex h-8 items-center text-sm font-medium'>
						{allValid && anyEntered ? money(total) : '—'}
					</p>
				</div>
				<Button
					size='sm'
					className='h-8'
					disabled={!allValid || !anyEntered || isPending}
					onClick={submit}
				>
					<Plus className='h-4 w-4' />
					Add
				</Button>
			</div>
		</div>
	);
}

/** The parts that make up a stored cost version's total. */
function CostBreakdown<P extends readonly CostPart[]>({
	parts,
	row,
}: {
	parts: P;
	row: Record<PartKey<P>, number>;
}) {
	return (
		<span className='text-xs text-muted-foreground'>
			{parts
				.map((part) => `${part.label} ${money(row[part.key as PartKey<P>])}`)
				.join(' + ')}
		</span>
	);
}

interface VersionListProps<T extends PriceVersion> {
	rows: T[];
	onDelete: (id: string) => void;
	emptyLabel: string;
	renderDetail?: (row: T) => ReactNode;
}

function VersionList<T extends PriceVersion>({
	rows,
	onDelete,
	emptyLabel,
	renderDetail,
}: VersionListProps<T>) {
	const { scheduled, current, history } = splitVersions(rows);

	if (rows.length === 0) {
		return <p className='text-xs text-muted-foreground'>{emptyLabel}</p>;
	}

	const Row = ({ row, tone }: { row: T; tone: 'current' | 'muted' }) => (
		<div className='group py-1'>
			<div className='flex items-center justify-between gap-2'>
				<span
					className={
						tone === 'current'
							? 'text-sm font-medium'
							: 'text-sm text-muted-foreground'
					}
				>
					{money(row.amount)}
				</span>
				<div className='flex items-center gap-2'>
					<span className='text-xs text-muted-foreground'>
						from {dateLabel(row.effectiveFrom)}
					</span>
					<button
						type='button'
						aria-label='Remove this version'
						onClick={() => onDelete(row.id)}
						className='text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive'
					>
						<Trash2 className='h-3.5 w-3.5' />
					</button>
				</div>
			</div>
			{renderDetail?.(row)}
		</div>
	);

	return (
		<div className='space-y-1'>
			{scheduled.length > 0 && (
				<details className='border-b pb-1'>
					<summary className='cursor-pointer text-xs text-muted-foreground hover:text-foreground'>
						{scheduled.length} scheduled
					</summary>
					<div className='mt-1 border-l pl-3'>
						{scheduled.map((row) => (
							<Row key={row.id} row={row} tone='muted' />
						))}
					</div>
				</details>
			)}

			{current && <Row row={current} tone='current' />}

			{history.length > 0 && (
				<details>
					<summary className='cursor-pointer text-xs text-muted-foreground hover:text-foreground'>
						{history.length} earlier{' '}
						{history.length === 1 ? 'version' : 'versions'}
					</summary>
					<div className='mt-1 border-l pl-3'>
						{history.map((row) => (
							<Row key={row.id} row={row} tone='muted' />
						))}
					</div>
				</details>
			)}
		</div>
	);
}

/**
 * One collapsible pricing section. The value in force sits in the header, so a
 * collapsed section still answers "what is this SKU priced at?" without opening.
 */
function PricingSection({
	value,
	title,
	summary,
	description,
	children,
}: {
	value: string;
	title: string;
	summary: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<AccordionItem value={value} className='rounded-lg border px-3'>
			<AccordionTrigger className='py-3 hover:no-underline'>
				<span className='flex flex-1 items-center justify-between gap-2 pr-2'>
					<span className='text-sm font-semibold'>{title}</span>
					<span className='text-xs font-medium text-muted-foreground'>
						{summary}
					</span>
				</span>
			</AccordionTrigger>
			<AccordionContent className='space-y-2 pb-3'>
				<p className='text-xs text-muted-foreground'>{description}</p>
				{children}
			</AccordionContent>
		</AccordionItem>
	);
}

/** A channel row inside a per-channel section: name plus the amount in force. */
function ChannelItem({
	channel,
	summary,
	children,
}: {
	channel: string;
	summary: string;
	children: ReactNode;
}) {
	return (
		<AccordionItem value={channel} className='rounded-md border px-3'>
			<AccordionTrigger className='py-2 hover:no-underline'>
				<span className='flex flex-1 items-center justify-between gap-2 pr-2'>
					<span className='text-sm font-medium'>{channel}</span>
					<span className='text-xs text-muted-foreground'>{summary}</span>
				</span>
			</AccordionTrigger>
			<AccordionContent className='space-y-2 pb-3'>{children}</AccordionContent>
		</AccordionItem>
	);
}

/**
 * A section header line: the amount in force today, plus a nudge when versions
 * are queued ahead of it — collapsing a section must not hide a pending change.
 */
const currentAmountLabel = (rows: PriceVersion[]): string => {
	const { current, scheduled } = splitVersions(rows);
	const amount = current ? money(current.amount) : 'Not set';
	return scheduled.length > 0
		? `${amount} · ${scheduled.length} scheduled`
		: amount;
};

interface SkuPricingSheetProps {
	skuSettingId: string | null;
	onClose: () => void;
}

export function SkuPricingSheet({
	skuSettingId,
	onClose,
}: SkuPricingSheetProps) {
	const { data, isLoading } = useSkuPricing(skuSettingId);

	// Hooks need a stable string; requests are gated on the id being set anyway.
	const id = skuSettingId ?? '';
	const addMsrp = useAddMsrp(id);
	const addCogs = useAddCogs(id);
	const addChannelFulfillmentCost = useAddChannelFulfillmentCost(id);
	const addChannelPrice = useAddChannelPrice(id);
	const deleteMsrp = useDeleteMsrp(id);
	const deleteCogs = useDeleteCogs(id);
	const deleteChannelFulfillmentCost = useDeleteChannelFulfillmentCost(id);
	const deleteChannelPrice = useDeleteChannelPrice(id);

	const msrps: SkuMsrpType[] = data?.msrps ?? [];
	const cogs: SkuCogsType[] = data?.cogs ?? [];
	const fulfillmentCosts: SkuChannelFulfillmentCostType[] =
		data?.channelFulfillmentCosts ?? [];
	const channelPrices: SkuChannelPriceType[] = data?.channelPrices ?? [];

	const currentCogs = splitVersions(cogs).current;
	const fulfillmentByChannel = byChannel(fulfillmentCosts);
	const pricesByChannel = byChannel(channelPrices);

	// Simple average of the channels that have a fulfillment cost in force today
	const currentFulfillment = fulfillmentByChannel.flatMap((group) =>
		group.current ? [group.current.amount] : []
	);
	const fulfillmentSummary = withScheduled(
		currentFulfillment.length === 0
			? 'Not set'
			: `Avg ${money(
					currentFulfillment.reduce((sum, amount) => sum + amount, 0) /
						currentFulfillment.length
				)} · ${currentFulfillment.length} of ${CHANNELS.length} set`,
		countScheduled(fulfillmentByChannel)
	);

	const pricingSummary = withScheduled(
		`${pricesByChannel.filter((group) => group.current).length} of ${CHANNELS.length} priced`,
		countScheduled(pricesByChannel)
	);

	return (
		<Sheet
			open={Boolean(skuSettingId)}
			onOpenChange={(open) => !open && onClose()}
		>
			<SheetContent className='w-full overflow-y-auto sm:max-w-xl gap-1'>
				<SheetHeader>
					<SheetTitle>{data?.title?.trim() || data?.sku}</SheetTitle>
					<SheetDescription>
						{data?.title?.trim() ? `${data.sku} · ` : ''}
						MSRP, COGS, fulfillment cost and channel pricing. Each change is a
						new version from its effective date; earlier versions are kept.
					</SheetDescription>
					<p className='rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground mt-2'>
						Amounts are for{' '}
						<strong className='font-medium'>one unit of this SKU</strong> —
						whatever it is sold as. Enter the cost of a single can for a can
						SKU, and of the whole case for a case SKU.
					</p>
					<DocLink
						doc='business/calculations'
						section='costs'
						className='mt-1 self-start'
					>
						How is this calculated?
					</DocLink>
				</SheetHeader>

				{isLoading && (
					<div className='space-y-4 px-4'>
						<Skeleton className='h-20 w-full' />
						<Skeleton className='h-40 w-full' />
					</div>
				)}

				{data && (
					<div className='px-4 pb-8'>
						<Accordion
							type='multiple'
							defaultValue={['msrp']}
							className='space-y-3'
						>
							<PricingSection
								value='msrp'
								title='MSRP'
								summary={currentAmountLabel(msrps)}
								description='One suggested retail price for this SKU, across channels.'
							>
								<VersionList
									rows={msrps}
									onDelete={(versionId) => deleteMsrp.mutate(versionId)}
									emptyLabel='No MSRP set yet.'
								/>
								<AddVersionForm
									label='MSRP per unit ($)'
									isPending={addMsrp.isPending}
									onSubmit={(amount, effectiveFrom) =>
										addMsrp.mutate({ amount, effectiveFrom })
									}
								/>
							</PricingSection>

							<PricingSection
								value='cogs'
								title='COGS'
								summary={currentAmountLabel(cogs)}
								description='Materials + production + shipping to the warehouse. The same in every channel.'
							>
								<VersionList
									rows={cogs}
									onDelete={(versionId) => deleteCogs.mutate(versionId)}
									emptyLabel='No COGS set yet.'
									renderDetail={(row) => (
										<CostBreakdown parts={COGS_PARTS} row={row} />
									)}
								/>
								<AddCostPartsForm
									parts={COGS_PARTS}
									title='New COGS version'
									totalLabel='COGS'
									isPending={addCogs.isPending}
									current={currentCogs}
									onSubmit={(values, effectiveFrom) =>
										addCogs.mutate({ ...values, effectiveFrom })
									}
								/>
							</PricingSection>

							<PricingSection
								value='fulfillment'
								title='Fulfillment cost'
								summary={fulfillmentSummary}
								description="Storage + pick + pack + shipping to the customer, per channel. For orders shipped through BlueBox, BlueBox's actual shipping cost replaces the shipping part."
							>
								<Accordion type='multiple' className='space-y-2'>
									{fulfillmentByChannel.map(({ channel, rows, current }) => (
										<ChannelItem
											key={channel}
											channel={channel}
											summary={currentAmountLabel(rows)}
										>
											<VersionList
												rows={rows}
												onDelete={(versionId) =>
													deleteChannelFulfillmentCost.mutate(versionId)
												}
												emptyLabel='No fulfillment cost set for this channel yet.'
												renderDetail={(row) => (
													<CostBreakdown parts={FULFILLMENT_PARTS} row={row} />
												)}
											/>
											<AddCostPartsForm
												parts={FULFILLMENT_PARTS}
												title='New fulfillment cost version'
												totalLabel='Fulfillment cost'
												isPending={addChannelFulfillmentCost.isPending}
												current={current}
												onSubmit={(values, effectiveFrom) =>
													addChannelFulfillmentCost.mutate({
														channel,
														...values,
														effectiveFrom,
													})
												}
											/>
										</ChannelItem>
									))}
								</Accordion>
							</PricingSection>

							<PricingSection
								value='channel-pricing'
								title='Channel pricing'
								summary={pricingSummary}
								description='Selling price per channel. Open a channel to see or add its versions.'
							>
								<Accordion type='multiple' className='space-y-2'>
									{pricesByChannel.map(({ channel, rows }) => (
										<ChannelItem
											key={channel}
											channel={channel}
											summary={currentAmountLabel(rows)}
										>
											<VersionList
												rows={rows}
												onDelete={(versionId) =>
													deleteChannelPrice.mutate(versionId)
												}
												emptyLabel='No price set for this channel yet.'
											/>
											<AddVersionForm
												label='Price per unit ($)'
												isPending={addChannelPrice.isPending}
												onSubmit={(amount, effectiveFrom) =>
													addChannelPrice.mutate({
														channel,
														amount,
														effectiveFrom,
													})
												}
											/>
										</ChannelItem>
									))}
								</Accordion>
							</PricingSection>
						</Accordion>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

export default SkuPricingSheet;
