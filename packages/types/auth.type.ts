import type { LoginEmailSchema, OtpSchema } from '@repo/schemas';
import type { z } from 'zod';

export interface AuthContextType {
	id: string;
	email: string;
	name: string;
	image?: string | null;
}

export type LoginEmailInput = z.infer<typeof LoginEmailSchema>;
export type OtpInput = z.infer<typeof OtpSchema>;
