import type { DataPipelineType } from '@repo/types';
import { z } from 'zod';
import type { ToolDef } from '../types.js';
import { shapeDataPipelines } from './shape.js';

export const dataPipelineTool: ToolDef = {
	name: 'get_data_pipelines',
	description:
		'Sync health for upstream sources (Shopify, BlueBox, QBO, etc.): last success time, status, and errors. Call before quoting time-sensitive stock, delivery, or revenue figures. Not a source of business metrics itself. QBO sync may succeed while no accounting data is exposed through any tool.',
	inputSchema: z.object({}),
	handler: async (client) => {
		const raw = await client.get<DataPipelineType[]>('/api/data-pipelines');
		return shapeDataPipelines(raw);
	},
};
