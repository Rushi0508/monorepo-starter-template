import type { GetRevenueResponseType } from '@repo/types';
import { omitKeys } from '../shared/schema.js';
import type { ToolDef } from '../types.js';
import { type RevenueInput, revenueInputSchema } from './schema.js';
import { shapeRevenue } from './shape.js';

export const revenueTool: ToolDef = {
	name: 'get_revenue',
	description:
		'Revenue and contribution margin for a date range with optional SKU filter and a channel or top-SKU breakdown. Use for headline P&L. COGS and fulfillment cost come from per-SKU costs in SKU settings (fulfillment per channel, with BlueBox actual shipping when available); costs not entered count as $0. Breaks revenue down by channel (default) or by SKU with breakdownBy: cases, gross/net revenue, gross and contribution margin per row, plus orders per channel. There is no channel filter input. Not for customer LTV (get_customers). Daily series only with includeTrend=true. No QBO or demand plan.',
	inputSchema: revenueInputSchema,
	handler: async (client, input) => {
		const parsed = input as RevenueInput;
		const params = omitKeys(parsed as Record<string, unknown>, [
			'includeTrend',
		]);

		const raw = await client.get<GetRevenueResponseType>(
			'/api/revenue',
			params
		);
		return shapeRevenue(raw, {
			skus: parsed.skus,
			includeTrend: Boolean(parsed.includeTrend),
		});
	},
};
