import { ChannelEnum } from '@repo/enums';
import { z } from 'zod';
import { orderDateRangeSchema, paginationSchema } from '../shared/schema.js';

export const DEFAULT_FULFILLMENT_LIMIT = 10;

export const fulfillmentInputSchema = z.object({
	search: z
		.string()
		.optional()
		.describe('Search order number, customer name, or email'),
	fulfillmentStatus: z
		.array(z.string())
		.optional()
		.describe('e.g. UNFULFILLED, FULFILLED, IN_PROGRESS'),
	channels: z
		.array(z.nativeEnum(ChannelEnum))
		.optional()
		.describe('Orders in any of these channels'),
	...orderDateRangeSchema,
	sortBy: z
		.enum([
			'totalPrice',
			'date',
			'dateOrderPicked',
			'dateOrderShipped',
			'dateOrderDelivered',
		])
		.optional()
		.describe('Sort field'),
	sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	...paginationSchema,
	includeDetail: z
		.boolean()
		.optional()
		.describe('Include line items and tracking detail (default false)'),
});

export type FulfillmentInput = z.infer<typeof fulfillmentInputSchema>;
