import type {
	CreateCustomerInput,
	CreateSampleOrdersInput,
	CreateSampleOrdersResponseType,
	CustomerFilterType,
	GetCustomerDetailResponseType,
	GetCustomersResponseType,
	UpdateCustomerInput,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class CustomersService {
	static async getCustomers(filters: CustomerFilterType) {
		return ApiClient.get<GetCustomersResponseType>('/api/customers', filters);
	}

	static async getCustomerDetail(id: string) {
		return ApiClient.get<GetCustomerDetailResponseType>(`/api/customers/${id}`);
	}

	static async updateCustomer(id: string, input: UpdateCustomerInput) {
		return ApiClient.patch<{ message: string }>(`/api/customers/${id}`, input);
	}

	static async createSampleOrders(input: CreateSampleOrdersInput) {
		return ApiClient.post<CreateSampleOrdersResponseType>(
			'/api/customers/sample-orders',
			input
		);
	}

	static async createCustomer(input: CreateCustomerInput) {
		return ApiClient.post('/api/customers', input);
	}
}
