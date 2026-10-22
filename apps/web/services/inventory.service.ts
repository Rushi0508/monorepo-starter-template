import type {
	CreateProductionRunInput,
	CreateReplenishmentOrderInput,
	GetAsnsResponseType,
	GetInventoryResponseType,
	GetInventorySummaryResponseType,
	GetKitOrdersResponseType,
	GetProductionRunsResponseType,
	InventoryLocationType,
	InventorySummaryFilterType,
	ReplenishmenOrdersResponseType,
	UpdateProductionRunInput,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class InventoryService {
	static async getInventorySummary(filters: InventorySummaryFilterType) {
		return ApiClient.get<GetInventorySummaryResponseType>(
			'/api/inventory/summary',
			filters
		);
	}

	// ── Bluebox ─────────────────────────────────────────────────────────────────────
	static async getBlueboxInventory() {
		return ApiClient.get<GetInventoryResponseType>('/api/inventory/bluebox');
	}

	static async getBlueboxAsns() {
		return ApiClient.get<GetAsnsResponseType>('/api/inventory/bluebox/asns');
	}

	static async getBlueboxProductionRuns() {
		return ApiClient.get<GetProductionRunsResponseType>(
			'/api/inventory/bluebox/production-runs'
		);
	}

	static async createBlueboxProductionRun(input: CreateProductionRunInput) {
		return ApiClient.post('/api/inventory/bluebox/production-runs', input);
	}

	static async updateBlueboxProductionRun(
		id: string,
		input: UpdateProductionRunInput
	) {
		return ApiClient.patch<{ message: string }>(
			`/api/inventory/bluebox/production-runs/${id}`,
			input
		);
	}

	static async deleteBlueboxProductionRun(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/inventory/bluebox/production-runs/${id}`
		);
	}

	static async getBlueboxKitOrders() {
		return ApiClient.get<GetKitOrdersResponseType>(
			'/api/inventory/bluebox/kit-orders'
		);
	}

	// ── Manuel Brothers ──────────────────────────────────────────────────────────
	static async getManuelBrothersInventory() {
		return ApiClient.get<InventoryLocationType[]>('/api/inventory/mb');
	}

	static async getReplenishmentOrders() {
		return ApiClient.get<ReplenishmenOrdersResponseType>(
			'/api/inventory/mb/replenishment-orders'
		);
	}

	static async createReplenishmentOrder(input: CreateReplenishmentOrderInput) {
		return ApiClient.post<{ message: string }>(
			'/api/inventory/mb/replenishment-orders',
			input
		);
	}
}
