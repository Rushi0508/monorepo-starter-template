'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ChannelEnum } from '@repo/enums';
import {
	CreateSkuChannelFulfillmentCostSchema,
	CreateSkuChannelPriceSchema,
	CreateSkuCogsSchema,
} from '@repo/schemas';
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { format } from 'date-fns';
import { useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { useAddPlanPricing } from '@/queries';

export type PricingKind = 'cogs' | 'channel-price' | 'channel-fulfillment-cost';

/** The parts each kind is entered in; the total is derived from them. */
const PARTS: Record<PricingKind, { name: string; label: string }[]> = {
	cogs: [
		{ name: 'materials', label: 'Materials' },
		{ name: 'production', label: 'Production' },
		{ name: 'shipping', label: 'Shipping (inbound)' },
	],
	'channel-fulfillment-cost': [
		{ name: 'storage', label: 'Storage' },
		{ name: 'pick', label: 'Pick' },
		{ name: 'pack', label: 'Pack' },
		{ name: 'shipping', label: 'Shipping (outbound)' },
	],
	'channel-price': [{ name: 'amount', label: 'Price per unit' }],
};

const TITLES: Record<PricingKind, string> = {
	cogs: 'Add cost of goods',
	'channel-price': 'Add price',
	'channel-fulfillment-cost': 'Add fulfillment cost',
};

const SCHEMAS = {
	cogs: CreateSkuCogsSchema,
	'channel-price': CreateSkuChannelPriceSchema,
	'channel-fulfillment-cost': CreateSkuChannelFulfillmentCostSchema,
};

type PricingFormValues = Record<string, number> & {
	effectiveFrom: string;
	channel?: ChannelEnum;
};

export const AddPricingDialog = ({
	planId,
	kind,
	skuSettingId,
	channel,
	skuLabel,
	open,
	onClose,
}: {
	planId: string;
	kind: PricingKind;
	skuSettingId: string;
	channel?: string;
	skuLabel: string;
	open: boolean;
	onClose: () => void;
}) => {
	const add = useAddPlanPricing(planId);
	const mutation =
		kind === 'cogs'
			? add.cogs
			: kind === 'channel-price'
				? add.price
				: add.fulfillment;

	const parts = PARTS[kind];

	/**
	 * What is actually in each box. A number-typed form value cannot represent a
	 * half-typed entry — clearing it would snap straight back to 0 — so the raw
	 * text is held alongside and the form keeps the parsed number. Blank reads as
	 * zero, so a cost with an unused part can be left empty.
	 */
	const [raw, setRaw] = useState<Record<string, string>>({});

	const form = useForm<PricingFormValues>({
		// Each kind validates against the schema its endpoint already uses; they
		// differ in shape, which one useForm generic cannot express.
		resolver: zodResolver(
			SCHEMAS[kind]
		) as unknown as Resolver<PricingFormValues>,
		defaultValues: {
			...Object.fromEntries(parts.map((part) => [part.name, 0])),
			effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
			...(channel ? { channel: channel as ChannelEnum } : {}),
		} as PricingFormValues,
	});

	// A cost is entered in parts; showing the running total saves adding it up.
	const total = parts.reduce(
		(sum, part) => sum + (Number(raw[part.name]) || 0),
		0
	);

	// A cost part left blank is genuinely zero, but a blank price is an empty
	// form rather than a free product, so it cannot be submitted.
	const isPriceMissing =
		kind === 'channel-price' && (raw.amount ?? '').trim() === '';

	const onSubmit = (values: PricingFormValues) =>
		mutation.mutate({ ...values, skuSettingId } as never, {
			onSuccess: () => onClose(),
		});

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{TITLES[kind]}</DialogTitle>
					<DialogDescription>
						{skuLabel}
						{channel ? ` in ${channel}` : ''}. It applies from its date forward
						and leaves earlier months as they were.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<div className='grid grid-cols-2 gap-3'>
							{parts.map((part) => (
								<FormField
									key={part.name}
									control={form.control}
									name={part.name}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{part.label}
												<RequiredStar />
											</FormLabel>
											<FormControl>
												<Input
													type='number'
													step='0.01'
													min={0}
													placeholder='0.00'
													value={raw[part.name] ?? ''}
													onChange={(event) => {
														const next = event.target.value;
														setRaw((current) => ({
															...current,
															[part.name]: next,
														}));
														field.onChange(next === '' ? 0 : Number(next));
													}}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							))}
						</div>

						{parts.length > 1 && (
							<p className='text-xs text-muted-foreground'>
								Total{' '}
								<span className='font-medium text-foreground tabular-nums'>
									{(Math.round(total * 100) / 100).toLocaleString(undefined, {
										style: 'currency',
										currency: 'USD',
									})}
								</span>{' '}
								per unit
							</p>
						)}

						<FormField
							control={form.control}
							name='effectiveFrom'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Effective from
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input type='date' {...field} />
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
								isLoading={mutation.isPending}
								disabled={isPriceMissing}
							>
								Save
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default AddPricingDialog;
