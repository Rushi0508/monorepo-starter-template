'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginEmailSchema, OTP_LENGTH, OtpSchema } from '@repo/schemas';
import type { LoginEmailInput, OtpInput } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@repo/ui/components/field';
import { Input } from '@repo/ui/components/input';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@repo/ui/components/input-otp';
import { ArrowLeft } from 'lucide-react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/general/LoadingButton';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { resolveAuthCallbackUrl } from '@/lib/auth-callback-url';
import { emailOtp, signIn } from '@/lib/auth-client';

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackURL = resolveAuthCallbackUrl(searchParams.get('callbackURL'));
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [pendingEmail, setPendingEmail] = useState('');
	const [isResending, setIsResending] = useState(false);
	const { secondsLeft, isCooldown, startCooldown } = useResendCooldown();

	const emailForm = useForm<LoginEmailInput>({
		resolver: zodResolver(LoginEmailSchema),
		defaultValues: { email: '' },
	});

	const otpForm = useForm<OtpInput>({
		resolver: zodResolver(OtpSchema),
		defaultValues: { otp: '' },
	});

	useEffect(() => {
		const error = searchParams.get('error');
		if (error) toast.error(error);
	}, [searchParams]);

	const sendOtp = (email: string) =>
		emailOtp.sendVerificationOtp({ email, type: 'sign-in' });

	const handleSendOtp = async ({ email }: LoginEmailInput) => {
		const { error } = await sendOtp(email);
		if (error) {
			toast.error(error.message ?? 'Failed to send OTP. Try again.');
			return;
		}

		setPendingEmail(email);
		startCooldown();
		setStep('otp');
		toast.success(`OTP sent to ${email}`);
	};

	const handleVerifyOtp = async ({ otp }: OtpInput) => {
		const { error } = await signIn.emailOtp({ email: pendingEmail, otp });
		if (error) {
			toast.error(error.message ?? 'Invalid OTP. Please try again.');
			otpForm.reset();
			return;
		}

		toast.success('Logged in');
		router.replace(callbackURL as Route);
		router.refresh();
	};

	const handleResendOtp = async () => {
		setIsResending(true);
		const { error } = await sendOtp(pendingEmail);
		setIsResending(false);

		if (error) {
			toast.error(error.message ?? 'Failed to resend OTP.');
			return;
		}

		otpForm.reset();
		startCooldown();
		toast.success('New OTP sent');
	};

	const handleBack = () => {
		otpForm.reset();
		setStep('email');
	};

	return (
		<Card className='w-full max-w-sm'>
			<CardHeader className='text-center'>
				<CardTitle className='text-xl'>Welcome back</CardTitle>
				<CardDescription>
					{step === 'email'
						? 'Enter your email to receive a one-time password'
						: `Enter the ${OTP_LENGTH}-digit code sent to ${pendingEmail}`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{step === 'email' ? (
					<form onSubmit={emailForm.handleSubmit(handleSendOtp)} noValidate>
						<FieldGroup>
							<Controller
								control={emailForm.control}
								name='email'
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											{...field}
											id={field.name}
											type='email'
											autoComplete='email'
											placeholder='you@example.com'
											aria-invalid={fieldState.invalid}
											autoFocus
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<LoadingButton
								type='submit'
								className='w-full'
								isLoading={emailForm.formState.isSubmitting}
							>
								Send OTP
							</LoadingButton>
						</FieldGroup>
					</form>
				) : (
					<form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} noValidate>
						<FieldGroup>
							<Controller
								control={otpForm.control}
								name='otp'
								render={({ field, fieldState }) => (
									<Field
										data-invalid={fieldState.invalid}
										className='items-center'
									>
										<FieldLabel htmlFor={field.name} className='sr-only'>
											One-time password
										</FieldLabel>
										<InputOTP
											id={field.name}
											maxLength={OTP_LENGTH}
											value={field.value}
											onChange={field.onChange}
											onComplete={otpForm.handleSubmit(handleVerifyOtp)}
											aria-invalid={fieldState.invalid}
											autoFocus
										>
											<InputOTPGroup>
												{Array.from({ length: OTP_LENGTH }, (_, index) => (
													<InputOTPSlot key={index} index={index} />
												))}
											</InputOTPGroup>
										</InputOTP>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
										<FieldDescription className='text-center'>
											Didn&apos;t get it?{' '}
											<button
												type='button'
												onClick={handleResendOtp}
												disabled={isCooldown || isResending}
												className='underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50'
											>
												{isCooldown
													? `Resend in ${secondsLeft}s`
													: 'Resend OTP'}
											</button>
										</FieldDescription>
									</Field>
								)}
							/>
							<div className='flex gap-2'>
								<Button type='button' variant='outline' onClick={handleBack}>
									<ArrowLeft />
									Back
								</Button>
								<LoadingButton
									type='submit'
									className='flex-1'
									isLoading={otpForm.formState.isSubmitting}
								>
									Verify & log in
								</LoadingButton>
							</div>
						</FieldGroup>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
