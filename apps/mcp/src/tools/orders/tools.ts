import type { GetOrdersResponseType } from '@repo/types';
import { omitKeys } from '../shared/schema.js';
import type { ToolDef } from '../types.js';
import {
	DEFAULT_ORDER_LIMIT,
	type OrdersInput,
	ordersInputSchema,
} from './schema.js';
import { shapeOrders } from './shape.js';

export const ordersTool: ToolDef = {
	name: 'get_orders',
	description:
		'Search and filter orders by number, customer, status, SKU, channel, or date; compact by default. Use to list or aggregate orders. Not for headline margin (get_revenue), stock (get_inventory), or on-time metrics (get_fulfillment). Line items, fulfillments, and address need includeDetail=true. No shipping zones, kitting costs, QBO, folk, or channel-margin reports. Channel on very new orders may be wrong until the next full sync.',
	inputSchema: ordersInputSchema,
	handler: async (client, input) => {
		const parsed = input as OrdersInput;
		const params = omitKeys(parsed as Record<string, unknown>, [
			'includeDetail',
		]);
		if (params.limit === undefined) params.limit = DEFAULT_ORDER_LIMIT;

		const raw = await client.get<GetOrdersResponseType>('/api/orders', params);
		return shapeOrders(raw, { includeDetail: Boolean(parsed.includeDetail) });
	},
};
