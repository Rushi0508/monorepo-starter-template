import { z } from 'zod';
import { RequiredDateSchema, StringSchema } from './common.schema';

export const CreateProductionRunSchema = z.object({
	sku: StringSchema.min(1, 'SKU is required'),
	productionDate: RequiredDateSchema,
	lotNumber: StringSchema.min(1, 'Lot number is required'),
	quantity: z
		.number('Quantity is required')
		.positive('Quantity must be greater than 0'),
});
