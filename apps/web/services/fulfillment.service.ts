import type {
	FulfillmentFilterType,
	GetFulfillmentResponseType,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class FulfillmentService {
	static async getFulfillment(filters: FulfillmentFilterType) {
		return ApiClient.get<GetFulfillmentResponseType>(
			'/api/fulfillment',
			filters
		);
	}
}
