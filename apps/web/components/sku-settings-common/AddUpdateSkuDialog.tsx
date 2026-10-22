'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSkuSettingSchema } from '@repo/schemas';
import type { CreateSkuSettingInput, SkuSettingType } from '@repo/types';
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
import { CheckCircle2, Loader2, MinusCircle, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import {
	useCheckSku,
	useCreateSkuSetting,
	useUpdateSkuSetting,
} from '@/queries';
import { SkuNamingCard } from './SkuNamingCard';

interface CheckRowProps {
	label: string;
	state: 'idle' | 'loading' | 'yes' | 'no';
}

function CheckRow({ label, state }: CheckRowProps) {
	return (
		<div className='flex items-center gap-2 text-sm'>
			{state === 'loading' && (
				<Loader2 className='size-4 animate-spin text-muted-foreground' />
			)}
			{state === 'yes' && <CheckCircle2 className='size-4 text-emerald-500' />}
			{state === 'no' && (
				<XCircle className='size-4 text-muted-foreground/60' />
			)}
			{state === 'idle' && (
				<MinusCircle className='size-4 text-muted-foreground/40' />
			)}
			<span
				className={
					state === 'yes' ? 'text-foreground' : 'text-muted-foreground'
				}
			>
				{label}
			</span>
		</div>
	);
}

interface AddUpdateSkuDialogProps {
	open: boolean;
	onClose: () => void;
	editingSku?: SkuSettingType | null;
}

export function AddUpdateSkuDialog({
	open,
	onClose,
	editingSku,
}: AddUpdateSkuDialogProps) {
	const isEditMode = !!editingSku;

	const getDefaultValues = useCallback((sku?: SkuSettingType | null) => {
		return { sku: sku?.sku || '', title: sku?.title || '' };
	}, []);

	const { mutate: createSku, isPending: isCreating } = useCreateSkuSetting();
	const { mutate: updateSku, isPending: isUpdating } = useUpdateSkuSetting();
	const isPending = isCreating || isUpdating;

	const form = useForm<CreateSkuSettingInput>({
		resolver: zodResolver(CreateSkuSettingSchema),
		defaultValues: getDefaultValues(editingSku),
	});

	const skuValue = form.watch('sku');

	const [debouncedSku, setDebouncedSku] = useState('');
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSku(skuValue.trim()), 500);
		return () => clearTimeout(timer);
	}, [skuValue]);

	const { data: check, isFetching: checkLoading } = useCheckSku(
		debouncedSku,
		editingSku?.id
	);

	const getState = (flag: boolean | undefined): CheckRowProps['state'] => {
		if (!debouncedSku || debouncedSku.length < 2) return 'idle';
		if (checkLoading) return 'loading';
		if (flag === undefined) return 'idle';
		return flag ? 'yes' : 'no';
	};

	useEffect(() => {
		if (open) {
			form.reset(getDefaultValues(editingSku));
			setDebouncedSku('');
		}
	}, [open, form, editingSku, getDefaultValues]);

	const onSubmit = (values: CreateSkuSettingInput) => {
		if (isEditMode) {
			updateSku(
				{ id: editingSku.id, input: values },
				{ onSuccess: () => onClose() }
			);
		} else {
			createSku(values, { onSuccess: () => onClose() });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEditMode ? 'Edit SKU' : 'Add SKU'}</DialogTitle>
					<DialogDescription>
						{isEditMode
							? 'Update the SKU identifier or display title.'
							: 'Add a new SKU to the settings table. Enter the identifier and a display title.'}
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
										<Input
											placeholder='e.g. SAU-SL-12OZ-12PK'
											autoComplete='off'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Title
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g. Salted Lime - 12oz - 12-pack'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='rounded-md border bg-muted/30 px-4 py-3 space-y-2'>
							<p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1'>
								Checks
							</p>
							<CheckRow
								label='Found in Shopify inventory'
								state={getState(check?.existsInShopify)}
							/>
							<CheckRow
								label='Found in Bluebox inventory'
								state={getState(check?.existsInBluebox)}
							/>
							<CheckRow
								label='Found in SimplyDepo products'
								state={getState(check?.existsInSimplyDepo)}
							/>
							<CheckRow
								label={
									isEditMode
										? 'Unique — not used by another SKU'
										: 'Unique — not yet in SKU settings'
								}
								state={
									debouncedSku.length >= 2 && !checkLoading
										? check?.existsInSettings
											? 'no'
											: 'yes'
										: getState(undefined)
								}
							/>
						</div>

						<SkuNamingCard />

						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								{isEditMode ? 'Save' : 'Add SKU'}
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
