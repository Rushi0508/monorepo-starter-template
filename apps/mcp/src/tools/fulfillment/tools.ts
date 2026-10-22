import type { GetFulfillmentResponseType } from '@repo/types';
import { omitKeys } from '../shared/schema.js';
import type { ToolDef } from '../types.js';
import {
	DEFAULT_FULFILLMENT_LIMIT,
	type FulfillmentInput,
	fulfillmentInputSchema,
} from './schema.js';
import { shapeFulfillment } from './shape.js';

export const fulfillmentTool: ToolDef = {
	name: 'get_fulfillment',
	description:
		'Delivery performance: avg lead/transit time, on-time rate, targets, and order rows with transit/lead days. Use for service-level and on-time questions. Not for revenue (get_revenue), POD emails (get_pod_emails), or stock (get_inventory). On-time uses warehouse delivery dates, not Shopify fulfilment status. Tracking and line items need includeDetail=true. Orders with no warehouse record are excluded from headline metrics.',
	inputSchema: fulfillmentInputSchema,
	handler: async (client, input) => {
		const parsed = input as FulfillmentInput;
		const params = omitKeys(parsed as Record<string, unknown>, [
			'includeDetail',
		]);
		if (params.limit === undefined) params.limit = DEFAULT_FULFILLMENT_LIMIT;

		const raw = await client.get<GetFulfillmentResponseType>(
			'/api/fulfillment',
			params
		);
		return shapeFulfillment(raw, {
			includeDetail: Boolean(parsed.includeDetail),
		});
	},
};
