import type { DataPipelineType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class DataPipelineService {
	static async getAll() {
		return ApiClient.get<DataPipelineType[]>('/api/data-pipelines');
	}

	static async trigger(name: string, force = false) {
		return ApiClient.post<{ message: string }, { force: boolean }>(
			`/api/data-pipelines/${name}/trigger`,
			{ force }
		);
	}

	static async setPaused(name: string, isPaused: boolean) {
		return ApiClient.patch<{ message: string }, { isPaused: boolean }>(
			`/api/data-pipelines/${name}/paused`,
			{ isPaused }
		);
	}
}
