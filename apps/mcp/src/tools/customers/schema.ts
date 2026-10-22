import { z } from 'zod';
import { orderDateRangeSchema, paginationSchema } from '../shared/schema.js';

export const DEFAULT_CUSTOMER_LIMIT = 10;
export const DEFAULT_ORDER_HISTORY = 5;
export const FULL_ORDER_HISTORY_CAP = 25;
export const SKU_VELOCITY_CAP = 10;

export const customersInputSchema = z.object({
	id: z
		.string()
		.optional()
		.describe('Customer UUID from a prior list result (detail mode)'),
	search: z.string().optional().describe('Search name or email'),
	...orderDateRangeSchema,
	minOrderCount: z.number().int().optional().describe('Minimum order count'),
	maxOrderCount: z.number().int().optional().describe('Maximum order count'),
	states: z
		.array(z.string())
		.optional()
		.describe('US state codes, e.g. ["CA","NY"]'),
	sortBy: z
		.enum([
			'orders',
			'grossRevenue',
			'netRevenue',
			'grossProfit',
			'netAov',
			'lastOrderDate',
		])
		.optional()
		.describe('Sort field (list mode)'),
	sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	...paginationSchema,
	includeOrderHistory: z
		.boolean()
		.optional()
		.describe(
			'Detail mode: detailed order history (default last 5 compact; capped at 25)'
		),
});

export type CustomersInput = z.infer<typeof customersInputSchema>;
