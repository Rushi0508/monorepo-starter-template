import type {
	CreateDemandPlanInput,
	CreateDemandScenarioInput,
	CreateSkuChannelFulfillmentCostInput,
	CreateSkuChannelPriceInput,
	CreateSkuCogsInput,
	DemandAccuracyFilterType,
	DemandComparisonType,
	DemandForecastMethodType,
	DemandGridCellType,
	DemandGridType,
	DemandImportResultType,
	DemandPlanAuditType,
	DemandPlanListItemType,
	DemandPlanPricingType,
	DemandPlanType,
	DemandScenarioListItemType,
	FinalizeDemandPlanInput,
	GetDemandAccuracyResponseType,
	SetDemandEntryInput,
	SetForecastMethodInput,
	UpdateDemandPlanInput,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class DemandPlanningService {
	/** The open draft, or the latest finalized plan when there is none. */
	static async getOperativePlan() {
		return ApiClient.get<DemandPlanType | null>('/api/demand-plans/operative');
	}

	static async getPlan(id: string) {
		return ApiClient.get<DemandPlanType>(`/api/demand-plans/${id}`);
	}

	static async listPlans() {
		return ApiClient.get<DemandPlanListItemType[]>('/api/demand-plans');
	}

	static async getAudits(planId: string) {
		return ApiClient.get<DemandPlanAuditType[]>(
			`/api/demand-plans/${planId}/audits`
		);
	}

	static async createPlan(input: CreateDemandPlanInput) {
		return ApiClient.post<DemandPlanType>('/api/demand-plans', input);
	}

	static async deletePlan(id: string) {
		return ApiClient.delete<{ message: string }>(`/api/demand-plans/${id}`);
	}

	static async updatePlan(id: string, input: UpdateDemandPlanInput) {
		return ApiClient.patch<DemandPlanType>(`/api/demand-plans/${id}`, input);
	}

	static async finalizePlan(id: string, input: FinalizeDemandPlanInput) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/${id}/finalize`,
			input
		);
	}

	static async getForecastMethods(planId: string) {
		return ApiClient.get<DemandForecastMethodType[]>(
			`/api/demand-plans/${planId}/forecast-methods`
		);
	}

	static async setForecastMethod(
		planId: string,
		input: SetForecastMethodInput
	) {
		return ApiClient.put<DemandForecastMethodType>(
			`/api/demand-plans/${planId}/forecast-methods`,
			input
		);
	}

	static async getPricing(planId: string) {
		return ApiClient.get<DemandPlanPricingType>(
			`/api/demand-plans/${planId}/pricing`
		);
	}

	static async addPlanCogs(
		planId: string,
		skuSettingId: string,
		input: CreateSkuCogsInput
	) {
		return ApiClient.post(
			`/api/demand-plans/${planId}/pricing/${skuSettingId}/cogs`,
			input
		);
	}

	static async addPlanFulfillmentCost(
		planId: string,
		skuSettingId: string,
		input: CreateSkuChannelFulfillmentCostInput
	) {
		return ApiClient.post(
			`/api/demand-plans/${planId}/pricing/${skuSettingId}/channel-fulfillment-cost`,
			input
		);
	}

	static async addPlanChannelPrice(
		planId: string,
		skuSettingId: string,
		input: CreateSkuChannelPriceInput
	) {
		return ApiClient.post(
			`/api/demand-plans/${planId}/pricing/${skuSettingId}/channel-price`,
			input
		);
	}

	static async removePlanPricing(
		planId: string,
		kind: 'cogs' | 'channel-fulfillment-cost' | 'channel-price',
		versionId: string
	) {
		return ApiClient.delete<{ message: string }>(
			`/api/demand-plans/${planId}/pricing/${kind}/${versionId}`
		);
	}

	static async comparePlans(planAId: string, planBId: string) {
		return ApiClient.get<DemandComparisonType>('/api/demand-plans/compare', {
			planAId,
			planBId,
		});
	}

	static async getAccuracy(filters: DemandAccuracyFilterType) {
		return ApiClient.get<GetDemandAccuracyResponseType>(
			'/api/demand-plans/accuracy',
			filters
		);
	}

	static async importPlan(id: string, file: File) {
		const body = new FormData();
		body.append('file', file);
		return ApiClient.post<DemandImportResultType>(
			`/api/demand-plans/${id}/import`,
			body
		);
	}

	static async unlockPlan(id: string) {
		return ApiClient.post<DemandPlanType>(`/api/demand-plans/${id}/unlock`, {});
	}

	static async rollForwardPlan(id: string) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/${id}/roll-forward`,
			{}
		);
	}

	static async listScenarios(basePlanId?: string) {
		return ApiClient.get<DemandScenarioListItemType[]>(
			'/api/demand-plans/scenarios',
			basePlanId ? { basePlanId } : undefined
		);
	}

	static async createScenario(input: CreateDemandScenarioInput) {
		return ApiClient.post<DemandPlanType>('/api/demand-plans/scenarios', input);
	}

	static async duplicateScenario(id: string) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/scenarios/${id}/duplicate`,
			{}
		);
	}

	static async saveScenario(id: string) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/scenarios/${id}/save`,
			{}
		);
	}

	static async reopenScenario(id: string) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/scenarios/${id}/reopen`,
			{}
		);
	}

	static async promoteScenario(id: string) {
		return ApiClient.post<DemandPlanType>(
			`/api/demand-plans/scenarios/${id}/promote`,
			{}
		);
	}

	static async deleteScenario(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/demand-plans/scenarios/${id}`
		);
	}

	static async getGrid(planId: string) {
		return ApiClient.get<DemandGridType>(`/api/demand-plans/${planId}/grid`);
	}

	static async setEntry(planId: string, input: SetDemandEntryInput) {
		return ApiClient.put<DemandGridCellType>(
			`/api/demand-plans/${planId}/entries`,
			input
		);
	}
}
