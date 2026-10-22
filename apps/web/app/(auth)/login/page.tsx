'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginEmailSchema, OtpSchema } from '@repo/schemas';
import { LoginEmailInput, OtpInput } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui/components/card';
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@repo/ui/components/input-otp';
import { cn } from '@repo/ui/lib/utils';
import { AnimatePresence, motion, Transition } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import LoadingButton from '@/components/general/LoadingButton';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { isAbsoluteUrl, resolveAuthCallbackUrl } from '@/lib/auth-callback-url';
import { emailOtp, signIn } from '@/lib/auth-client';

// Shared fade+slide transition for all step switches
const stepVariants = {
	initial: { opacity: 0, y: 16 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -16 },
};

const stepTransition: Transition = { duration: 0.3, ease: 'easeInOut' };

export default function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackURL = resolveAuthCallbackUrl(searchParams.get('callbackURL'));
	const postLoginURL = callbackURL;
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [pendingEmail, setPendingEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
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

	const handleSendOtp = async (data: LoginEmailInput) => {
		setIsLoading(true);
		const { error } = await emailOtp.sendVerificationOtp({
			email: data.email,
			type: 'sign-in',
		});
		setIsLoading(false);

		if (error) {
			toast.error(error.message ?? 'Failed to send OTP. Try again.', {
				duration: 10000,
			});
			return;
		}

		setPendingEmail(data.email);
		toast.success(`OTP sent to ${data.email}`);
		startCooldown();
		setStep('otp');
	};

	const handleVerifyOtp = async (data: OtpInput) => {
		setIsLoading(true);
		try {
			const { error } = await signIn.emailOtp({
				email: pendingEmail,
				otp: data.otp,
			});

			if (error) {
				toast.error(error.message ?? 'Invalid OTP. Please try again.', {
					duration: 10000,
				});
				otpForm.reset();
				return;
			}

			toast.success('Login successful');
			if (isAbsoluteUrl(postLoginURL)) {
				window.location.assign(postLoginURL);
				return;
			}
			router.push(postLoginURL);
		} catch {
			toast.error('Failed to sign in. Try again.', { duration: 10000 });
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOtp = async () => {
		setIsResending(true);
		const { error } = await emailOtp.sendVerificationOtp({
			email: pendingEmail,
			type: 'sign-in',
		});
		setIsResending(false);

		if (error) {
			toast.error(error.message ?? 'Failed to resend OTP.', {
				duration: 10000,
			});
			return;
		}

		otpForm.reset();
		startCooldown();
		toast.success('New OTP sent to your email');
	};

	const description =
		step === 'otp'
			? `Enter the 6-digit code sent to ${pendingEmail}`
			: 'Enter your email to receive a one-time password';

	return (
		<div className='from-background via-background to-muted/20 flex min-h-screen w-full items-center justify-center bg-linear-to-br p-4'>
			<motion.div
				className={cn('mx-auto flex w-full max-w-lg')}
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeInOut' }}
			>
				<Card className={cn('w-full')}>
					<CardHeader className='space-y-4'>
						<div className='relative mx-auto size-14'>
							<Image
								src='/images/logo.png'
								alt='Starter logo'
								fill
								className='object-contain'
								priority
							/>
						</div>
						<CardTitle className='font-heading text-primary text-center text-4xl font-normal'>
							Welcome to Starter
						</CardTitle>
						{/* Description animates when step changes */}
						<AnimatePresence mode='wait'>
							<motion.div
								key={description}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.25 }}
							>
								<CardDescription className='text-center'>
									{description}
								</CardDescription>
							</motion.div>
						</AnimatePresence>
					</CardHeader>

					<CardContent>
						<AnimatePresence mode='wait'>
							{/* ── Step 1: Email ── */}
							{step === 'email' && (
								<motion.div
									key='email-step'
									variants={stepVariants}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={stepTransition}
								>
									<Form key='emailForm' {...emailForm}>
										<form
											onSubmit={emailForm.handleSubmit(handleSendOtp)}
											className='flex flex-col gap-6'
										>
											<FormField
												control={emailForm.control}
												name='email'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Email</FormLabel>
														<FormControl>
															<Input
																type='email'
																placeholder='you@example.com'
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<LoadingButton
												type='submit'
												className='w-full'
												disabled={emailForm.formState.isSubmitting || isLoading}
												isLoading={isLoading}
											>
												Send OTP
											</LoadingButton>
										</form>
									</Form>
								</motion.div>
							)}

							{/* ── Step 2: OTP ── */}
							{step === 'otp' && (
								<motion.div
									key='otp-step'
									variants={stepVariants}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={stepTransition}
								>
									<Form key='otpForm' {...otpForm}>
										<form
											onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
											className='flex flex-col gap-6'
										>
											<FormField
												control={otpForm.control}
												name='otp'
												render={({ field }) => (
													<FormItem className='mx-auto'>
														<FormControl>
															<InputOTP
																value={field.value}
																onChange={field.onChange}
																maxLength={6}
																// Auto-submit once all 6 digits are entered
																onComplete={() =>
																	otpForm.handleSubmit(handleVerifyOtp)()
																}
																autoFocus
															>
																<InputOTPGroup>
																	<InputOTPSlot index={0} />
																	<InputOTPSlot index={1} />
																	<InputOTPSlot index={2} />
																</InputOTPGroup>
																<InputOTPGroup>
																	<InputOTPSlot index={3} />
																	<InputOTPSlot index={4} />
																	<InputOTPSlot index={5} />
																</InputOTPGroup>
															</InputOTP>
														</FormControl>
														<FormMessage className='text-center' />
														<FormDescription className='text-center'>
															OTP expires in 10 minutes.
														</FormDescription>
														<button
															type='button'
															onClick={handleResendOtp}
															disabled={isCooldown || isResending}
															className={cn(
																'text-sm text-center w-full',
																isCooldown || isResending
																	? 'text-muted-foreground cursor-not-allowed'
																	: 'text-primary cursor-pointer hover:underline'
															)}
														>
															{isResending
																? 'Sending...'
																: isCooldown
																	? `Resend OTP (${secondsLeft}s)`
																	: 'Resend OTP'}
														</button>
													</FormItem>
												)}
											/>

											<div className='flex items-center justify-between gap-2'>
												<Button
													variant='outline'
													type='button'
													onClick={() => {
														setStep('email');
														otpForm.reset();
													}}
												>
													<ArrowLeft />
													Go Back
												</Button>
												<LoadingButton
													type='submit'
													disabled={otpForm.formState.isSubmitting || isLoading}
													isLoading={isLoading}
												>
													Verify & Login
												</LoadingButton>
											</div>
										</form>
									</Form>
								</motion.div>
							)}
						</AnimatePresence>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
