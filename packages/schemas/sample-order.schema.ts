import { z } from 'zod';

export const SampleOrderItemSchema = z.object({
	sku: z.string().min(1, 'SKU is required'),
	quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const SampleOrderFormSchema = z.object({
	items: z.array(SampleOrderItemSchema).min(1, 'At least one item is required'),
	note: z.string().trim().optional(),
	tags: z.array(z.string()),
});

export const CreateSampleOrdersSchema = SampleOrderFormSchema.extend({
	customerIds: z.array(z.uuid()).min(1, 'Select at least one customer'),
});
