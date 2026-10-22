import type {
	DashboardFilterType,
	GetDashboardResponseType,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class DashboardService {
	static async getDashboard(filters: DashboardFilterType) {
		return ApiClient.get<GetDashboardResponseType>('/api/dashboard', filters);
	}
}
