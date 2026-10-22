import { z } from 'zod';

export const ReplenishmentOrderItemSchema = z.object({
	sku: z.string().min(1, 'SKU is required'),
	quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const CreateReplenishmentOrderSchema = z.object({
	items: z
		.array(ReplenishmentOrderItemSchema)
		.min(1, 'At least one item is required'),
	sendPickupEmail: z.boolean(),
});
