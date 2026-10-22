import { ChannelEnum } from '@repo/enums';
import { z } from 'zod';
import { orderDateRangeSchema, paginationSchema } from '../shared/schema.js';

export const DEFAULT_ORDER_LIMIT = 10;

export const ordersInputSchema = z.object({
	search: z
		.string()
		.optional()
		.describe('Search order number, customer name, or email'),
	paymentStatus: z
		.array(z.string())
		.optional()
		.describe('e.g. PAID, PENDING, REFUNDED'),
	fulfillmentStatus: z
		.array(z.string())
		.optional()
		.describe('e.g. UNFULFILLED, FULFILLED, IN_PROGRESS'),
	skus: z
		.array(z.string())
		.optional()
		.describe('Orders containing any of these SKUs'),
	channels: z
		.array(z.nativeEnum(ChannelEnum))
		.optional()
		.describe('Orders in any of these channels'),
	...orderDateRangeSchema,
	sortBy: z.enum(['date', 'netRevenue']).optional().describe('Sort field'),
	sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	...paginationSchema,
	includeDetail: z
		.boolean()
		.optional()
		.describe('Include line items, fulfillments, address (default false)'),
});

export type OrdersInput = z.infer<typeof ordersInputSchema>;
