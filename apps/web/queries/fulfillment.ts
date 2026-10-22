import type { FulfillmentFilterType } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { FulfillmentService } from '@/services';

const fulfillmentQueryKeys = {
	all: ['fulfillment'] as const,
	list: (filters: FulfillmentFilterType) =>
		[...fulfillmentQueryKeys.all, filters] as const,
};

export function useFulfillment(filters: FulfillmentFilterType) {
	return useQuery({
		queryKey: fulfillmentQueryKeys.list(filters),
		queryFn: () => FulfillmentService.getFulfillment(filters),
	});
}
