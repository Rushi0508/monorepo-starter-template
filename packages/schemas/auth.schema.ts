import { z } from 'zod';
import { EmailSchema } from './common.schema';

export const OtpSchema = z.object({
	otp: z
		.string()
		.min(1, 'OTP is required')
		.length(6, 'OTP must be 6 digits')
		.regex(/^\d+$/, 'OTP must be a number'),
});

export const LoginEmailSchema = z.object({
	email: EmailSchema,
});
