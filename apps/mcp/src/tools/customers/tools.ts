import type {
	GetCustomerDetailResponseType,
	GetCustomersResponseType,
} from '@repo/types';
import { omitKeys } from '../shared/schema.js';
import type { ToolDef } from '../types.js';
import {
	type CustomersInput,
	customersInputSchema,
	DEFAULT_CUSTOMER_LIMIT,
} from './schema.js';
import { shapeCustomerDetail, shapeCustomerList } from './shape.js';

export const customersTool: ToolDef = {
	name: 'get_customers',
	description:
		'Find customers or detail by id: order counts, revenue, profit, AOV, SKU velocity, and order history. Use for customer LTV and repeat behavior. Gross profit uses per-SKU COGS from SKU settings, the same as get_revenue. Not for company-wide revenue rollup (get_revenue) or stock. Full order history needs includeOrderHistory=true (capped at 25 detailed). No folk CRM or ad attribution.',
	inputSchema: customersInputSchema,
	handler: async (client, input) => {
		const parsed = input as CustomersInput;
		if (parsed.id) {
			const raw = await client.get<GetCustomerDetailResponseType>(
				`/api/customers/${parsed.id}`
			);
			return shapeCustomerDetail(raw, {
				includeOrderHistory: Boolean(parsed.includeOrderHistory),
			});
		}

		const params = omitKeys(parsed as Record<string, unknown>, [
			'id',
			'includeOrderHistory',
		]);
		if (params.limit === undefined) params.limit = DEFAULT_CUSTOMER_LIMIT;

		const raw = await client.get<GetCustomersResponseType>(
			'/api/customers',
			params
		);
		return shapeCustomerList(raw);
	},
};
