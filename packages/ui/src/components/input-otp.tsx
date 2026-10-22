'use client';

import { cn } from '@repo/ui/lib/utils';
import { OTPInput, OTPInputContext, SlotProps } from 'input-otp';
import * as React from 'react';

const InputOTP = React.forwardRef<
	React.ElementRef<typeof OTPInput>,
	React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
	<OTPInput
		ref={ref}
		containerClassName={cn(
			'flex items-center gap-6 has-[:disabled]:opacity-50',
			containerClassName
		)}
		className={cn('disabled:cursor-not-allowed', className)}
		{...props}
	/>
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('flex items-center gap-2', className)}
		{...props}
	/>
));
InputOTPGroup.displayName = 'InputOTPGroup';

const InputOTPSlot = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
	const inputOTPContext = React.useContext(OTPInputContext);
	const { char, hasFakeCaret, isActive } = inputOTPContext.slots[
		index
	] as SlotProps;

	return (
		<div
			ref={ref}
			className={cn(
				'bg-background relative flex h-14 w-12 items-center justify-center rounded-xl text-2xl transition-all',
				isActive ? 'border-input border-2' : 'border',
				className
			)}
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
					<div className='animate-caret-blink bg-foreground h-6 w-px duration-1000' />
				</div>
			)}
		</div>
	);
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
	React.ElementRef<'div'>,
	React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
	<div ref={ref} {...props}>
		<hr className='h-full w-px bg-muted' />
	</div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
