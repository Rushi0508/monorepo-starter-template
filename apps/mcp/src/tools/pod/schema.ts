import { InboundEmailTypeEnum } from '@repo/enums';
import { z } from 'zod';

export const POD_EMAIL_CAP = 25;

export const podInputSchema = z.object({
	type: z
		.nativeEnum(InboundEmailTypeEnum)
		.optional()
		.describe('POD (default) or PICKUP'),
	includeConnectionStatus: z
		.boolean()
		.optional()
		.describe('Include Gmail connection status (default true)'),
});

export type PodInput = z.infer<typeof podInputSchema>;
