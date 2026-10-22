import type {
	GetSkuAuditLogsResponseType,
	GetSkuSettingsResponseType,
	SkuCheckResult,
} from '@repo/types';
import type { ToolDef } from '../types.js';
import { type SkuInput, skuInputSchema } from './schema.js';
import { shapeAuditLogs, shapeSkuDetail, shapeSkuList } from './shape.js';

export const skuTool: ToolDef = {
	name: 'get_sku_settings',
	description:
		'SKU master list, custom fields, channel presence, and cross-system catalog check. Use for product setup questions. Not for live inventory quantities (get_inventory). Does not return versioned landed cost, channel price, or MSRP history. List is paged (default 50); pass sku for detail. Optional includeAuditLogs for settings changes.',
	inputSchema: skuInputSchema,
	handler: async (client, input) => {
		const parsed = input as SkuInput;
		const settings =
			await client.get<GetSkuSettingsResponseType>('/api/skus/settings');

		const base = parsed.sku
			? await (async () => {
					const check = await client.get<SkuCheckResult>(
						'/api/skus/settings/check',
						{ sku: parsed.sku }
					);
					return shapeSkuDetail(settings, parsed.sku!, check);
				})()
			: shapeSkuList(settings, { page: parsed.page, limit: parsed.limit });

		if (!parsed.includeAuditLogs) return base;

		const audit = await client.get<GetSkuAuditLogsResponseType>(
			'/api/skus/audit-logs'
		);
		return {
			...base,
			...shapeAuditLogs(audit),
		};
	},
};
