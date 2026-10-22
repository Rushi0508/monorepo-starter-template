import type { GetRevenueResponseType, RevenueFilterType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class RevenueService {
	static async getRevenue(filters: RevenueFilterType) {
		return ApiClient.get<GetRevenueResponseType>('/api/revenue', filters);
	}
}
