import type { OrderFilterType } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { OrdersService } from '@/services';

const ordersQueryKeys = {
	all: ['orders'] as const,
	list: (filters: OrderFilterType) =>
		[...ordersQueryKeys.all, filters] as const,
};

export function useOrders(filters: OrderFilterType) {
	return useQuery({
		queryKey: ordersQueryKeys.list(filters),
		queryFn: () => OrdersService.getOrders(filters),
	});
}
