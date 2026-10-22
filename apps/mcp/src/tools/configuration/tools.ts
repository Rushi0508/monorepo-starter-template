import type { ConfigurationType } from '@repo/types';
import { z } from 'zod';
import type { ToolDef } from '../types.js';
import { shapeConfiguration } from './shape.js';

export const configurationTool: ToolDef = {
	name: 'get_configuration',
	description:
		'Read-only system settings: D2C/B2B max transit days and Manuel Brothers distributor email addresses. Use for delivery targets. Not for COGS or fulfillment cost, which are set per SKU in SKU settings. Does not change settings.',
	inputSchema: z.object({}),
	handler: async (client) => {
		const raw = await client.get<ConfigurationType>('/api/configuration');
		return shapeConfiguration(raw);
	},
};
