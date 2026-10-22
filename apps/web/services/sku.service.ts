import type {
	CreateSkuChannelFulfillmentCostInput,
	CreateSkuChannelPriceInput,
	CreateSkuCogsInput,
	CreateSkuColumnInput,
	CreateSkuMsrpInput,
	CreateSkuSettingInput,
	GetSkuAuditLogsResponseType,
	GetSkuSettingsResponseType,
	ReorderSkuColumnsInput,
	SkuCheckResult,
	SkuColumnType,
	SkuOptionsFilterType,
	SkuOptionType,
	SkuSettingType,
	UpdateSkuSettingsInput,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class SkuService {
	static async getAuditLogs() {
		return ApiClient.get<GetSkuAuditLogsResponseType>('/api/skus/audit-logs');
	}

	static async getSkuOptions(filter?: SkuOptionsFilterType) {
		return ApiClient.get<SkuOptionType[]>('/api/skus/options', filter);
	}

	static async getSkuSettings() {
		return ApiClient.get<GetSkuSettingsResponseType>('/api/skus/settings');
	}

	static async checkSku(sku: string, excludeId?: string) {
		const params = new URLSearchParams({ sku });
		if (excludeId) params.set('excludeId', excludeId);
		return ApiClient.get<SkuCheckResult>(`/api/skus/settings/check?${params}`);
	}

	static async createSkuSetting(input: CreateSkuSettingInput) {
		return ApiClient.post<{ message: string }>('/api/skus/settings', input);
	}

	static async updateSkuSettings(input: UpdateSkuSettingsInput) {
		return ApiClient.put<{ message: string }>('/api/skus/settings', input);
	}

	static async updateSkuSetting(
		id: string,
		input: Partial<CreateSkuSettingInput>
	) {
		return ApiClient.patch<{ message: string }>(
			`/api/skus/settings/${id}`,
			input
		);
	}

	static async deleteSkuSetting(id: string) {
		return ApiClient.delete<{ message: string }>(`/api/skus/settings/${id}`);
	}

	static async createColumn(input: CreateSkuColumnInput) {
		return ApiClient.post<SkuColumnType>('/api/skus/columns', input);
	}

	static async updateColumn(id: string, input: Partial<CreateSkuColumnInput>) {
		return ApiClient.patch<SkuColumnType>(`/api/skus/columns/${id}`, input);
	}

	static async reorderColumns(input: ReorderSkuColumnsInput) {
		return ApiClient.put<{ message: string }>(
			'/api/skus/columns/reorder',
			input
		);
	}

	static async deleteColumn(id: string) {
		return ApiClient.delete<{ message: string }>(`/api/skus/columns/${id}`);
	}

	// ── Pricing ───────────────────────────────────────────────────────────────

	static async getSkuPricing(skuSettingId: string) {
		return ApiClient.get<SkuSettingType>(`/api/skus/pricing/${skuSettingId}`);
	}

	static async addCogs(skuSettingId: string, input: CreateSkuCogsInput) {
		return ApiClient.post<{ message: string }>(
			`/api/skus/pricing/${skuSettingId}/cogs`,
			input
		);
	}

	static async addChannelFulfillmentCost(
		skuSettingId: string,
		input: CreateSkuChannelFulfillmentCostInput
	) {
		return ApiClient.post<{ message: string }>(
			`/api/skus/pricing/${skuSettingId}/channel-fulfillment-cost`,
			input
		);
	}

	static async addChannelPrice(
		skuSettingId: string,
		input: CreateSkuChannelPriceInput
	) {
		return ApiClient.post<{ message: string }>(
			`/api/skus/pricing/${skuSettingId}/channel-price`,
			input
		);
	}

	static async addMsrp(skuSettingId: string, input: CreateSkuMsrpInput) {
		return ApiClient.post<{ message: string }>(
			`/api/skus/pricing/${skuSettingId}/msrp`,
			input
		);
	}

	static async deleteCogs(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/skus/pricing/cogs/${id}`
		);
	}

	static async deleteChannelFulfillmentCost(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/skus/pricing/channel-fulfillment-cost/${id}`
		);
	}

	static async deleteChannelPrice(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/skus/pricing/channel-price/${id}`
		);
	}

	static async deleteMsrp(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/skus/pricing/msrp/${id}`
		);
	}
}
