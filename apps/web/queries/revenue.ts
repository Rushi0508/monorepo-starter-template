import type { RevenueFilterType } from '@repo/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RevenueService } from '@/services';

const revenueQueryKeys = {
	all: ['revenue'] as const,
	data: (filters: RevenueFilterType) =>
		[...revenueQueryKeys.all, filters] as const,
};

export function useRevenue(filters: RevenueFilterType) {
	return useQuery({
		queryKey: revenueQueryKeys.data(filters),
		queryFn: () => RevenueService.getRevenue(filters),
		// Switching a view refetches; keep the page on screen instead of skeletons
		placeholderData: keepPreviousData,
	});
}
