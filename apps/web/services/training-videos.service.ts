import type { CreateTrainingVideoInput, TrainingVideoType } from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class TrainingVideosService {
	static async list() {
		return ApiClient.get<TrainingVideoType[]>('/api/training-videos');
	}

	static async create(input: CreateTrainingVideoInput) {
		return ApiClient.post<{ message: string }>('/api/training-videos', input);
	}

	static async update(id: string, data: Partial<CreateTrainingVideoInput>) {
		return ApiClient.patch<{ message: string }>(
			`/api/training-videos/${id}`,
			data
		);
	}

	static async delete(id: string) {
		return ApiClient.delete<{ message: string }>(`/api/training-videos/${id}`);
	}
}
