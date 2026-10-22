import { z } from 'zod';
import { paginationSchema } from '../shared/schema.js';

export const LOW_STOCK_THRESHOLD = 20;
export const EXPIRING_DEFAULT_DAYS = 60;
export const STOCK_CAP = 20;
export const ASN_CAP = 20;
export const PRODUCTION_CAP = 10;
export const MB_STOCK_CAP = 20;
export const MB_REPLENISHMENT_CAP = 20;
export const KIT_ORDER_CAP = 20;
export const CROSS_WAREHOUSE_CAP = 20;

export const inventoryInputSchema = z.object({
	view: z
		.enum([
			'summary',
			'cross_warehouse_summary',
			'bluebox_stock',
			'bluebox_inbound',
			'bluebox_production',
			'bluebox_kit_orders',
			'mb_stock',
			'mb_replenishment',
		])
		.optional()
		.describe(
			'summary (default), cross_warehouse_summary, bluebox_stock|inbound|production|kit_orders, mb_stock|replenishment'
		),
	breakdownBy: z
		.enum(['sku', 'location'])
		.optional()
		.describe('cross_warehouse_summary grouping (default sku)'),
	sku: z.string().optional().describe('Filter to a single SKU'),
	includeDetail: z
		.boolean()
		.optional()
		.describe('Include lots / ASN packages (default false)'),
	expiringWithinDays: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('On stock views, include lots expiring within N days'),
	...paginationSchema,
});

export type InventoryInput = z.infer<typeof inventoryInputSchema>;
export type InventoryView = NonNullable<InventoryInput['view']>;

export type PageOpts = { page?: number; limit?: number };
