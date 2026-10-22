'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReplenishmentOrderSchema } from '@repo/schemas';
import type { CreateReplenishmentOrderInput } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
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
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import SearchableSelect from '@/components/general/SearchableSelect';
import { useCreateReplenishmentOrder, useSkuOptions } from '@/queries';

interface AddReplenishmentOrderDialogProps {
	open: boolean;
	onClose: () => void;
}

export const AddReplenishmentOrderDialog = ({
	open,
	onClose,
}: AddReplenishmentOrderDialogProps) => {
	const { data: skuOptions, isLoading: skusLoading } = useSkuOptions({
		status: 'active',
		connectedTo: 'bluebox',
	});
	const { mutate: createOrder, isPending } = useCreateReplenishmentOrder();

	const form = useForm<CreateReplenishmentOrderInput>({
		resolver: zodResolver(CreateReplenishmentOrderSchema),
		defaultValues: {
			items: [{ sku: '', quantity: 1 }],
			sendPickupEmail: true,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'items',
	});

	const onSubmit = (values: CreateReplenishmentOrderInput) => {
		createOrder(values, {
			onSuccess: () => {
				onClose();
			},
		});
	};

	const skuSelectOptions = (skuOptions ?? []).map((s) => ({
		label: `${s.sku} - ${s.title}`,
		value: s.sku,
	}));

	useEffect(() => {
		if (open) {
			form.reset({ items: [{ sku: '', quantity: 1 }], sendPickupEmail: true });
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Add Replenishment Order</DialogTitle>
					<DialogDescription>
						Create an order to replenish Manuel Brothers inventory via BlueBox.
					</DialogDescription>
				</DialogHeader>

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
														placeholder='50'
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
							onClick={() => append({ sku: '', quantity: 1 })}
						>
							<Plus className='mr-1 h-3 w-3' />
							Add Item
						</Button>

						<FormField
							control={form.control}
							name='sendPickupEmail'
							render={({ field: f }) => (
								<FormItem className='flex items-center gap-2 space-y-0'>
									<FormControl>
										<Checkbox
											checked={f.value}
											onCheckedChange={(checked) =>
												f.onChange(checked === true)
											}
										/>
									</FormControl>
									<FormLabel className='font-normal'>
										Send pickup email to Manuel Brothers
									</FormLabel>
								</FormItem>
							)}
						/>

						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								Create Order
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
