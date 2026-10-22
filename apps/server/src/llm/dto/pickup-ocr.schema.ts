import { z } from 'zod';

export const PickupOcrSchema = z.object({
	orderNumbers: z
		.array(z.string())
		.describe(
			'Sauero replenishment references on the document, "MB-" followed by digits (e.g. "MB-0008")'
		),
});

export type PickupOcrResult = z.infer<typeof PickupOcrSchema>;
