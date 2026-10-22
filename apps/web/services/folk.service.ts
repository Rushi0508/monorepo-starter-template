import type {
	FolkCustomerOption,
	FolkCustomerSearchInput,
	FolkFieldPreflightResultType,
	FolkLinkCustomerInput,
	FolkMappingFilterType,
	FolkMappingSummaryType,
	FolkSeedResultType,
	GetFolkGroupsResponseType,
	GetFolkMappingsResponseType,
	SetFolkTrackedGroupsInput,
	SetFolkTrackedGroupsResultType,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class FolkService {
	static async listGroups() {
		return ApiClient.get<GetFolkGroupsResponseType>('/api/folk/groups');
	}

	static async setTrackedGroups(data: SetFolkTrackedGroupsInput) {
		return ApiClient.put<SetFolkTrackedGroupsResultType>(
			'/api/folk/groups',
			data
		);
	}

	static async listMappings(filters: FolkMappingFilterType) {
		return ApiClient.get<GetFolkMappingsResponseType>(
			'/api/folk/mappings',
			filters
		);
	}

	static async summary() {
		return ApiClient.get<FolkMappingSummaryType>('/api/folk/mappings/summary');
	}

	static async searchCustomers(data: FolkCustomerSearchInput) {
		return ApiClient.get<FolkCustomerOption[]>('/api/folk/customers', data);
	}

	static async linkCustomer(id: string, data: FolkLinkCustomerInput) {
		return ApiClient.post<{ message: string }>(
			`/api/folk/mappings/${id}/customers`,
			data
		);
	}

	static async unlinkCustomer(id: string, customerId: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/folk/mappings/${id}/customers/${customerId}`
		);
	}

	static async denyProposal(id: string) {
		return ApiClient.post<{ message: string }>(`/api/folk/mappings/${id}/deny`);
	}

	static async markUnmapped(id: string) {
		return ApiClient.post<{ message: string }>(
			`/api/folk/mappings/${id}/unmapped`
		);
	}

	static async seed() {
		return ApiClient.post<FolkSeedResultType>('/api/folk/seed');
	}

	static async preflight() {
		return ApiClient.post<FolkFieldPreflightResultType>(
			'/api/folk/fields/preflight'
		);
	}
}
