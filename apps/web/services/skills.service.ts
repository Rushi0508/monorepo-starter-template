import { ApiClient } from '@/lib/api-client';

export class SkillsService {
	/**
	 * Downloads a skill folder from the NestJS backend as a zip Blob.
	 * The blob can be turned into a download via URL.createObjectURL.
	 */
	static async downloadSkillZip(slug: string): Promise<Blob> {
		return ApiClient.getBlob(`/api/skills/${slug}`);
	}
}
