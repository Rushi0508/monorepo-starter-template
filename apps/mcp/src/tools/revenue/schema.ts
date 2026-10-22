import { z } from 'zod';
import { orderDateRangeSchema } from '../shared/schema.js';

export const TREND_DAYS = 14;
export const TOP_SKU_CAP = 10;

export const revenueInputSchema = z.object({
	...orderDateRangeSchema,
	skus: z
		.array(z.string())
		.optional()
		.describe('Limit SKU breakdown to these SKUs'),
	breakdownBy: z
		.enum(['channel', 'sku'])
		.optional()
		.describe('Break revenue and margin down by channel (default) or by SKU'),
	includeTrend: z
		.boolean()
		.optional()
		.describe(`Include the last ${TREND_DAYS} daily points (default false)`),
});

export type RevenueInput = z.infer<typeof revenueInputSchema>;
