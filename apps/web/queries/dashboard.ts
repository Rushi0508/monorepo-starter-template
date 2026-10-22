import type { DashboardFilterType } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/services';

const dashboardQueryKeys = {
	all: ['dashboard'] as const,
	data: (filters: DashboardFilterType) =>
		[...dashboardQueryKeys.all, filters] as const,
};

export function useDashboard(filters: DashboardFilterType) {
	return useQuery({
		queryKey: dashboardQueryKeys.data(filters),
		queryFn: () => DashboardService.getDashboard(filters),
	});
}
