import type { ConfigurationType, UpdateConfigurationInput } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class ConfigurationService {
	static async getConfiguration() {
		return ApiClient.get<ConfigurationType>('/api/configuration');
	}

	static async updateConfiguration(input: UpdateConfigurationInput) {
		return ApiClient.put<{ message: string }>('/api/configuration', input);
	}
}
