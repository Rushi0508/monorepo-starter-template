import type {
	GetAsnsResponseType,
	GetInventoryResponseType,
	GetInventorySummaryResponseType,
	GetKitOrdersResponseType,
	GetProductionRunsResponseType,
	InventoryLocationType,
	ReplenishmenOrdersResponseType,
} from '@repo/types';
import type { ToolDef } from '../types.js';
import {
	type InventoryInput,
	type InventoryView,
	inventoryInputSchema,
} from './schema.js';
import {
	shapeBlueboxInbound,
	shapeBlueboxKitOrders,
	shapeBlueboxProduction,
	shapeBlueboxStock,
	shapeCrossWarehouseSummary,
	shapeInventorySummary,
	shapeMbReplenishment,
	shapeMbStock,
} from './shape.js';

export const inventoryTool: ToolDef = {
	name: 'get_inventory',
	description:
		'Warehouse and distributor stock: BlueBox/iDrive stock, inbound ASNs, production runs, kit orders, Manuel Brothers stock, replenishment, and cross-warehouse stock value. Use for lots, expiry, and stock levels. Not for orders or revenue. Default view=summary; list views are paged. Lots, ASN packages, and kit components need includeDetail or expiringWithinDays. Figures are not live — call get_data_pipelines for freshness before quoting stock.',
	inputSchema: inventoryInputSchema,
	handler: async (client, input) => {
		const parsed = input as InventoryInput;
		const view: InventoryView = parsed.view ?? 'summary';
		const sku = parsed.sku;
		const includeDetail = Boolean(parsed.includeDetail);
		const expiringWithinDays = parsed.expiringWithinDays;
		const pageOpts = { page: parsed.page, limit: parsed.limit };

		if (view === 'summary') {
			const [inventory, asns, production, mbStock, mbReplenishment] =
				await Promise.all([
					client.get<GetInventoryResponseType>('/api/inventory/bluebox'),
					client.get<GetAsnsResponseType>('/api/inventory/bluebox/asns'),
					client.get<GetProductionRunsResponseType>(
						'/api/inventory/bluebox/production-runs'
					),
					client.get<InventoryLocationType[]>('/api/inventory/mb'),
					client.get<ReplenishmenOrdersResponseType>(
						'/api/inventory/mb/replenishment-orders'
					),
				]);
			return shapeInventorySummary({
				inventory,
				asns,
				production,
				mbStock,
				mbReplenishment,
			});
		}

		if (view === 'bluebox_stock') {
			const inventory = await client.get<GetInventoryResponseType>(
				'/api/inventory/bluebox'
			);
			return shapeBlueboxStock(inventory, {
				sku,
				includeDetail,
				expiringWithinDays,
				...pageOpts,
			});
		}

		if (view === 'bluebox_inbound') {
			const asns = await client.get<GetAsnsResponseType>(
				'/api/inventory/bluebox/asns'
			);
			return shapeBlueboxInbound(asns, { sku, includeDetail, ...pageOpts });
		}

		if (view === 'bluebox_production') {
			const production = await client.get<GetProductionRunsResponseType>(
				'/api/inventory/bluebox/production-runs'
			);
			return shapeBlueboxProduction(production, { sku, ...pageOpts });
		}

		if (view === 'bluebox_kit_orders') {
			const kitOrders = await client.get<GetKitOrdersResponseType>(
				'/api/inventory/bluebox/kit-orders'
			);
			return shapeBlueboxKitOrders(kitOrders, {
				sku,
				includeDetail,
				...pageOpts,
			});
		}

		if (view === 'cross_warehouse_summary') {
			const summary = await client.get<GetInventorySummaryResponseType>(
				'/api/inventory/summary',
				parsed.breakdownBy ? { breakdownBy: parsed.breakdownBy } : undefined
			);
			return shapeCrossWarehouseSummary(summary, {
				includeDetail,
				...pageOpts,
			});
		}

		if (view === 'mb_stock') {
			const rows =
				await client.get<InventoryLocationType[]>('/api/inventory/mb');
			return shapeMbStock(rows, { sku, ...pageOpts });
		}

		const rows = await client.get<ReplenishmenOrdersResponseType>(
			'/api/inventory/mb/replenishment-orders'
		);
		return shapeMbReplenishment(rows, { sku, ...pageOpts });
	},
};
