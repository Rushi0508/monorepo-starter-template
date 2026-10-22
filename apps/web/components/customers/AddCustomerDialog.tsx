'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { US_STATES } from '@repo/constants';
import { CreateCustomerSchema } from '@repo/schemas';
import type { CreateCustomerInput } from '@repo/types';
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
import { PhoneInput } from '@repo/ui/components/phone-input';
import { Textarea } from '@repo/ui/components/textarea';
import { useEffect } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';
import AlertMessage from '@/components/general/AlertMessage';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import SearchableSelect from '@/components/general/SearchableSelect';
import { useCreateCustomer } from '@/queries';

interface AddCustomerDialogProps {
	open: boolean;
	onClose: () => void;
}

const EMPTY: CreateCustomerInput = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	company: '',
	address1: '',
	address2: '',
	city: '',
	provinceCode: '',
	zip: '',
	note: '',
};

const STATE_OPTIONS = US_STATES.map(({ label, value }) => ({ label, value }));

const AddCustomerDialog = ({ open, onClose }: AddCustomerDialogProps) => {
	const {
		mutate: createCustomer,
		isPending,
		error,
		reset: resetMutation,
	} = useCreateCustomer();

	const form = useForm<CreateCustomerInput>({
		resolver: zodResolver(CreateCustomerSchema),
		defaultValues: EMPTY,
	});

	useEffect(() => {
		if (open) {
			form.reset(EMPTY);
			resetMutation();
		}
	}, [open, form, resetMutation]);

	useEffect(() => {
		if (!error) return;
		const subscription = form.watch(() => resetMutation());
		return () => subscription.unsubscribe();
	}, [error, form, resetMutation]);

	const onSubmit = (values: CreateCustomerInput) => {
		createCustomer(values, { onSuccess: onClose });
	};

	const textField = (
		name: FieldPath<CreateCustomerInput>,
		label: string,
		options: { required?: boolean; placeholder?: string; type?: string } = {}
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>
						{label}
						{options.required && <RequiredStar />}
					</FormLabel>
					<FormControl>
						<Input
							type={options.type ?? 'text'}
							placeholder={options.placeholder}
							{...field}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Add Customer</DialogTitle>
					<DialogDescription>
						The customer will be created in Shopify.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<div className='grid grid-cols-2 items-start gap-3'>
							{textField('firstName', 'First name', { required: true })}
							{textField('lastName', 'Last name', { required: true })}
						</div>
						{textField('email', 'Email', { type: 'email' })}
						<FormField
							control={form.control}
							name='phone'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<PhoneInput
											defaultCountry='US'
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{textField('company', 'Company')}

						<p className='pt-2 text-sm font-medium'>Delivery address</p>
						{textField('address1', 'Street address', { required: true })}
						{textField('address2', 'Apt, suite, etc.')}
						<div className='grid grid-cols-3 items-start gap-3'>
							{textField('city', 'City', { required: true })}
							<FormField
								control={form.control}
								name='provinceCode'
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											State
											<RequiredStar />
										</FormLabel>
										<FormControl>
											<SearchableSelect
												options={STATE_OPTIONS}
												value={field.value}
												onChange={field.onChange}
												placeholder='Select'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{textField('zip', 'ZIP', { required: true })}
						</div>
						<FormField
							control={form.control}
							name='note'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Delivery notes</FormLabel>
									<FormControl>
										<Textarea
											placeholder='Gate code, dock hours, who to ask for…'
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
								Create customer
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default AddCustomerDialog;
