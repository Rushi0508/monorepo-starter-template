import type { GetDashboardResponseType } from '@repo/types';
import type { ToolDef } from '../types.js';
import { type DashboardInput, dashboardInputSchema } from './schema.js';
import { shapeDashboard } from './shape.js';

export const dashboardTool: ToolDef = {
	name: 'get_dashboard',
	description:
		'Headline business health for a date range: orders, net revenue, units shipped, alerts, order-status mix, top SKUs, new-vs-returning. Use for overview questions. Not for customer LTV (get_customers), full P&L with COGS (get_revenue), or on-time delivery (get_fulfillment). Dashboard "delivered" follows store fulfilment, not warehouse delivery dates. Daily trend and sessions only with includeTrend/includeSessions; sessions are Shopify traffic, not ad or Klaviyo attribution.',
	inputSchema: dashboardInputSchema,
	handler: async (client, input) => {
		const { dateStart, dateEnd, includeTrend, includeSessions } =
			input as DashboardInput;

		const params: Record<string, unknown> = {};
		if (dateStart) params.dateStart = dateStart;
		if (dateEnd) params.dateEnd = dateEnd;

		const raw = await client.get<GetDashboardResponseType>(
			'/api/dashboard',
			params
		);

		return shapeDashboard(raw, {
			includeTrend: Boolean(includeTrend),
			includeSessions: Boolean(includeSessions),
		});
	},
};
