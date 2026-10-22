'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	SAMPLE_ORDER_DEFAULT_TAGS,
	SAMPLE_ORDER_OPTIONAL_TAGS,
} from '@repo/constants';
import { SampleOrderFormSchema } from '@repo/schemas';
import type {
	CreateSampleOrdersResponseType,
	GetCustomerDetailResponseType,
	SampleOrderFormInput,
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { Textarea } from '@repo/ui/components/textarea';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import AlertMessage from '@/components/general/AlertMessage';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import SearchableSelect from '@/components/general/SearchableSelect';
import { useCreateSampleOrders, useSkuOptions } from '@/queries';
import { formatAddress } from './customer-detail/ContactCard';

export type SampleOrderRecipient = {
	id: string;
	name: string;
	defaultAddress: GetCustomerDetailResponseType['defaultAddress'];
};

interface SampleOrderDialogProps {
	customers: SampleOrderRecipient[];
	open: boolean;
	onClose: () => void;
	failedNote?: string;
	onComplete?: (response: CreateSampleOrdersResponseType) => void;
}

const EMPTY_ITEM = { sku: '', quantity: 1 };

const TAG_OPTIONS = [
	...SAMPLE_ORDER_DEFAULT_TAGS.map((tag) => ({
		label: tag,
		value: tag,
		locked: true,
	})),
	...SAMPLE_ORDER_OPTIONAL_TAGS.map((tag) => ({ label: tag, value: tag })),
];

const DEFAULT_VALUES: SampleOrderFormInput = {
	items: [EMPTY_ITEM],
	note: '',
	tags: [],
};

const RecipientList = ({
	customers,
}: {
	customers: SampleOrderRecipient[];
}) => {
	const [first] = customers;
	if (customers.length === 1 && first) {
		const lines = first.defaultAddress
			? formatAddress(first.defaultAddress)
			: [];
		return (
			<div className='flex items-start gap-2 text-sm text-muted-foreground'>
				<MapPin className='mt-0.5 size-4 shrink-0' />
				{lines.length ? (
					<span>Ships to {lines.join(', ')}</span>
				) : (
					<span className='text-destructive'>
						No default shipping address on this customer.
					</span>
				)}
			</div>
		);
	}

	return (
		<div className='max-h-40 divide-y overflow-y-auto rounded-md border text-sm'>
			{customers.map((c) => {
				const lines = c.defaultAddress ? formatAddress(c.defaultAddress) : [];
				return (
					<div
						key={c.id}
						className='flex items-center justify-between gap-3 px-3 py-1.5'
					>
						<span className='truncate font-medium'>{c.name}</span>
						{lines.length ? (
							<span className='truncate text-xs text-muted-foreground'>
								{lines.at(-1)}
							</span>
						) : (
							<span className='shrink-0 text-xs text-destructive'>
								No address
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
};

const SampleOrderDialog = ({
	customers,
	open,
	onClose,
	failedNote,
	onComplete,
}: SampleOrderDialogProps) => {
	const { data: skuOptions, isLoading: skusLoading } = useSkuOptions({
		status: 'active',
		connectedTo: 'shopify',
	});
	const {
		mutate: createSampleOrders,
		isPending,
		error,
		reset: resetMutation,
	} = useCreateSampleOrders({ failedNote });

	const form = useForm<SampleOrderFormInput>({
		resolver: zodResolver(SampleOrderFormSchema),
		defaultValues: DEFAULT_VALUES,
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'items',
	});

	useEffect(() => {
		if (open) {
			form.reset(DEFAULT_VALUES);
			resetMutation();
		}
	}, [open, form, resetMutation]);

	const onSubmit = (values: SampleOrderFormInput) => {
		createSampleOrders(
			{ ...values, customerIds: customers.map((c) => c.id) },
			{
				onSuccess: (response) => {
					onComplete?.(response);
					onClose();
				},
			}
		);
	};

	const skuSelectOptions = (skuOptions ?? []).map((s) => ({
		label: `${s.sku} - ${s.title}`,
		value: s.sku,
	}));

	const title =
		customers.length === 1
			? 'Send Sample Order'
			: `Send Sample Orders to ${customers.length} Customers`;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{customers.length === 1
							? 'Creates a $0 order in Shopify'
							: 'Creates a separate $0 order in Shopify for each customer, with the items below,'}{' '}
						tagged Sample-Sauerobase and sample. Customers are not charged or
						emailed.
					</DialogDescription>
				</DialogHeader>

				<RecipientList customers={customers} />

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<div className='space-y-3'>
							{fields.map((field, index) => (
								<div key={field.id} className='flex items-end gap-2'>
									<FormField
										control={form.control}
										name={`items.${index}.sku`}
										render={({ field: f }) => (
											<FormItem className='flex-1'>
												{index === 0 && (
													<FormLabel>
														SKU
														<RequiredStar />
													</FormLabel>
												)}
												<FormControl>
													<SearchableSelect
														options={skuSelectOptions}
														value={f.value}
														onChange={f.onChange}
														placeholder={
															skusLoading ? 'Loading…' : 'Select SKU'
														}
														disabled={skusLoading}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`items.${index}.quantity`}
										render={({ field: f }) => (
											<FormItem className='w-28'>
												{index === 0 && (
													<FormLabel>
														Qty
														<RequiredStar />
													</FormLabel>
												)}
												<FormControl>
													<Input
														type='number'
														min={1}
														{...f}
														onChange={(e) =>
															f.onChange(
																e.target.value === ''
																	? ''
																	: Number(e.target.value)
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type='button'
										variant='ghost'
										size='icon'
										onClick={() => remove(index)}
										disabled={fields.length === 1}
										className='shrink-0'
									>
										<Trash2 className='size-4 text-destructive' />
									</Button>
								</div>
							))}
						</div>

						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => append(EMPTY_ITEM)}
						>
							<Plus className='mr-1 h-3 w-3' />
							Add Item
						</Button>

						<FormField
							control={form.control}
							name='tags'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tags</FormLabel>
									<FormControl>
										<MultiSelect
											options={TAG_OPTIONS}
											defaultValue={[
												...SAMPLE_ORDER_DEFAULT_TAGS,
												...field.value,
											]}
											onValueChange={(values) =>
												field.onChange(
													values.filter(
														(v) => !SAMPLE_ORDER_DEFAULT_TAGS.includes(v)
													)
												)
											}
											placeholder='Select tags'
											maxCount={6}
											disableSelectAll
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='note'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Note</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Why this sample is going out...'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{error && (
							<AlertMessage message={error.message} variant='destructive' />
						)}

						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								Done
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default SampleOrderDialog;
