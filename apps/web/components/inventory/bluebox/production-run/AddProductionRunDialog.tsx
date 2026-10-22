'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductionRunSchema } from '@repo/schemas';
import { CreateProductionRunInput } from '@repo/types/dist';
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import SearchableSelect from '@/components/general/SearchableSelect';
import { useCreateBlueboxProductionRun, useSkuOptions } from '@/queries';

interface AddProductionRunDialogProps {
	open: boolean;
	onClose: () => void;
}

export const AddProductionRunDialog = ({
	open,
	onClose,
}: AddProductionRunDialogProps) => {
	const { data: skuOptions, isLoading: skusLoading } = useSkuOptions();
	const { mutate: createRun, isPending } = useCreateBlueboxProductionRun();

	const form = useForm<CreateProductionRunInput>({
		resolver: zodResolver(CreateProductionRunSchema),
		defaultValues: {
			sku: '',
			productionDate: '',
			lotNumber: '',
			quantity: 1,
		},
	});

	const onSubmit = (values: CreateProductionRunInput) => {
		createRun(values, {
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
			form.reset();
		}
	}, [open, form]);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Add Production Run</DialogTitle>
					<DialogDescription>
						Add a new production run to track lot numbers and quantities.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='sku'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										SKU
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<SearchableSelect
											options={skuSelectOptions}
											value={field.value}
											onChange={field.onChange}
											placeholder={skusLoading ? 'Loading SKUs…' : 'Select SKU'}
											disabled={skusLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='productionDate'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Production Date
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input type='date' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='lotNumber'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Lot Number
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input placeholder='e.g. LOT-2024-001' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='quantity'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Quantity
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											type='number'
											min={1}
											placeholder='e.g. 100'
											{...field}
											onChange={(e) =>
												field.onChange(
													e.target.value === '' ? '' : Number(e.target.value)
												)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								Add Run
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
