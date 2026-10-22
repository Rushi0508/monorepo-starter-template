'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateConfigurationSchema } from '@repo/schemas';
import type { ConfigurationType, UpdateConfigurationInput } from '@repo/types';
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
import { Save } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AlertMessage from '@/components/general/AlertMessage';
import LoadingButton from '@/components/general/LoadingButton';
import { PageHeader } from '@/components/general/PageHeader';
import { useConfiguration, useUpdateConfiguration } from '@/queries';
import FolkGroupsField from './FolkGroupsField';
import GmailConnection from './GmailConnection';

const ConfigurationComponent = () => {
	const { data, isLoading, error } = useConfiguration();
	const { mutate: save, isPending } = useUpdateConfiguration();

	const getDefaultValues = useCallback(
		(config?: ConfigurationType): UpdateConfigurationInput => {
			return {
				d2cMaxTransitDays: config?.d2cMaxTransitDays ?? 7,
				b2bMaxTransitDays: config?.b2bMaxTransitDays ?? 7,
				mbDistributorEmail: config?.mbDistributorEmail ?? null,
				mbDistributorCcEmails: config?.mbDistributorCcEmails ?? null,
			};
		},
		[]
	);

	const form = useForm<UpdateConfigurationInput>({
		resolver: zodResolver(UpdateConfigurationSchema),
		defaultValues: getDefaultValues(),
	});

	const { isDirty } = form.formState;

	useEffect(() => {
		if (data) {
			form.reset(getDefaultValues(data));
		}
	}, [data, form, getDefaultValues]);

	const onSubmit = (values: UpdateConfigurationInput) => {
		save(values);
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Configuration'
				description='Manage system-wide settings that affect calculations and business logic across all modules. Changes take effect immediately on the next data refresh.'
				actions={
					<LoadingButton
						type='button'
						size='sm'
						isLoading={isPending}
						disabled={!isDirty || isPending || isLoading}
						onClick={form.handleSubmit(onSubmit)}
					>
						<Save className='size-3.5' />
						Save changes
					</LoadingButton>
				}
			/>

			<GmailConnection />

			{error && <AlertMessage message={error.message} variant='destructive' />}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
					<div className='rounded-lg border bg-card divide-y px-5'>
						<FolkGroupsField />

						<FormField
							control={form.control}
							name='d2cMaxTransitDays'
							render={({ field }) => (
								<FormItem className='grid grid-cols-2 gap-6 py-5 space-y-0'>
									<div className='space-y-1'>
										<FormLabel>DTC max transit days</FormLabel>
										<FormDescription>
											Orders shipped via the Direct-to-Consumer channel are
											considered on-time if delivered within this many days of
											going in-transit.
										</FormDescription>
										<FormMessage />
									</div>
									<div className='flex items-center gap-2'>
										<FormControl>
											<Input
												type='number'
												min={1}
												className='h-9 w-24 text-sm'
												disabled={isLoading}
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value === '' ? '' : Number(e.target.value)
													)
												}
											/>
										</FormControl>
										<span className='text-sm text-muted-foreground shrink-0'>
											days
										</span>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='b2bMaxTransitDays'
							render={({ field }) => (
								<FormItem className='grid grid-cols-2 gap-6 py-5 space-y-0'>
									<div className='space-y-1'>
										<FormLabel>B2B max transit days</FormLabel>
										<FormDescription>
											Orders shipped via the B2B / wholesale channel are
											considered on-time if delivered within this many days of
											going in-transit.
										</FormDescription>
										<FormMessage />
									</div>
									<div className='flex items-center gap-2'>
										<FormControl>
											<Input
												type='number'
												min={1}
												className='h-9 w-24 text-sm'
												disabled={isLoading}
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value === '' ? '' : Number(e.target.value)
													)
												}
											/>
										</FormControl>
										<span className='text-sm text-muted-foreground shrink-0'>
											days
										</span>
									</div>
								</FormItem>
							)}
						/>

						<div className='space-y-4 py-5'>
							<div className='space-y-1'>
								<p className='text-sm leading-none font-medium'>
									Distributor email (Manuel Brothers)
								</p>
								<p className='text-sm text-muted-foreground'>
									Used when sending emails to the distributor. Leave primary
									blank to skip sending.
								</p>
							</div>

							<div className='grid gap-4 sm:grid-cols-2 items-start'>
								<FormField
									control={form.control}
									name='mbDistributorEmail'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='text-xs text-muted-foreground'>
												Primary
											</FormLabel>
											<FormControl>
												<Input
													type='email'
													placeholder='distributor@example.com'
													className='h-9 text-sm'
													disabled={isLoading}
													value={field.value ?? ''}
													onChange={(e) =>
														field.onChange(
															e.target.value === '' ? null : e.target.value
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='mbDistributorCcEmails'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='text-xs text-muted-foreground'>
												CC
												<span className='font-normal'> • comma-separated</span>
											</FormLabel>
											<FormControl>
												<Input
													type='text'
													placeholder='ops@example.com, finance@example.com'
													className='h-9 text-sm'
													disabled={isLoading}
													value={field.value ?? ''}
													onChange={(e) =>
														field.onChange(
															e.target.value === '' ? null : e.target.value
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default ConfigurationComponent;
