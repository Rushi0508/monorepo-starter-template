import type { GetOrdersResponseType, OrderFilterType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class OrdersService {
	static async getOrders(filters: OrderFilterType) {
		return ApiClient.get<GetOrdersResponseType>('/api/orders', filters);
	}
}
