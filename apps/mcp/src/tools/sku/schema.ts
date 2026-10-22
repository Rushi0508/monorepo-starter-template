import { z } from 'zod';
import { paginationSchema } from '../shared/schema.js';

export const AUDIT_LOG_CAP = 20;
export const SKU_LIST_CAP = 50;

export const skuInputSchema = z.object({
	sku: z
		.string()
		.optional()
		.describe('When set, return custom fields, columns, and catalog presence'),
	includeAuditLogs: z
		.boolean()
		.optional()
		.describe('Include recent SKU settings audit activity (default false)'),
	...paginationSchema,
});

export type SkuInput = z.infer<typeof skuInputSchema>;
