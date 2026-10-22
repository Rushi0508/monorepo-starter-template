import { BUSINESS_TIME_ZONE } from '@repo/constants';
import axios, { type AxiosInstance } from 'axios';

export class SaueroApiClient {
	private readonly http: AxiosInstance;
	private authorization: string | null = null;

	constructor(baseUrl: string) {
		this.http = axios.create({
			baseURL: baseUrl,
			headers: {
				'Content-Type': 'application/json',
				// Date filters resolve in this zone. Without it the API falls back to
				// UTC, which shifts every day boundary away from what the app shows.
				'x-timezone': BUSINESS_TIME_ZONE,
			},
			timeout: 30_000,
		});
	}

	isAuthenticated(): boolean {
		return this.authorization !== null;
	}

	setAuthorization(authorization: string): void {
		this.authorization = authorization;
	}

	clearAuthorization(): void {
		this.authorization = null;
	}

	async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
		if (!this.authorization) {
			throw new Error(
				'Not authenticated. Connect the MCP client with OAuth (browser login) and retry.'
			);
		}

		const response = await this.http.get<T>(path, {
			params,
			headers: {
				Authorization: this.authorization,
			},
			// Express 5's simple query parser keeps `key[]` as a literal key, so
			// arrays must go as repeated `key=value` pairs to reach the DTOs.
			paramsSerializer: (p) => {
				const searchParams = new URLSearchParams();
				for (const [key, val] of Object.entries(p)) {
					if (val === undefined || val === null) continue;
					for (const v of Array.isArray(val) ? val : [val]) {
						searchParams.append(key, String(v));
					}
				}
				return searchParams.toString();
			},
		});

		return response.data;
	}
}
