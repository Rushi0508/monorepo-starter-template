import { z } from 'zod';
import { EmailSchema } from './common.schema';

export const OTP_LENGTH = 6;

export const OtpSchema = z.object({
	otp: z
		.string()
		.min(1, 'OTP is required')
		.length(OTP_LENGTH, `OTP must be ${OTP_LENGTH} digits`)
		.regex(/^\d+$/, 'OTP must be a number'),
});

export const LoginEmailSchema = z.object({
	email: EmailSchema,
});
