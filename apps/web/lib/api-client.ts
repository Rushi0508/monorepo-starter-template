import { deepTrim } from '@repo/utils';
import type { AxiosRequestConfig } from 'axios';
import axios, { isAxiosError } from 'axios';
import { envConfig } from '@/env-config';

const client = axios.create({
	baseURL: envConfig.apiUrl,
	withCredentials: true,
	paramsSerializer: {
		serialize: (params: Record<string, unknown>) => {
			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value === undefined || value === null || value === '') continue;
				const values = Array.isArray(value) ? value : [value];
				for (const item of values) searchParams.append(key, String(item));
			}
			return searchParams.toString();
		},
	},
});

export class ApiClient {
	private static async getServerSideHeaders(): Promise<Record<string, string>> {
		if (typeof globalThis.window !== 'undefined') {
			return {};
		}

		try {
			const { headers } = await import('next/headers');
			const cookie = (await headers()).get('cookie');
			return cookie ? { cookie } : {};
		} catch {
			return {};
		}
	}

	static async request<T>(config: AxiosRequestConfig): Promise<T> {
		const isFormData = config.data instanceof FormData;

		try {
			const response = await client.request<T>({
				...config,
				data: config.data && !isFormData ? deepTrim(config.data) : config.data,
				params: config.params ? deepTrim(config.params) : undefined,
				headers: {
					...(await ApiClient.getServerSideHeaders()),
					...config.headers,
				},
			});
			return response.data;
		} catch (err) {
			if (isAxiosError<{ message?: string | string[] }>(err)) {
				const message = err.response?.data?.message;
				throw new Error(
					(Array.isArray(message) ? message[0] : message) ||
						'Something went wrong'
				);
			}
			throw err instanceof Error ? err : new Error('Something went wrong');
		}
	}

	static get<T>(url: string, params?: object): Promise<T> {
		return ApiClient.request<T>({ method: 'GET', url, params });
	}

	static post<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'POST', url, data });
	}

	static put<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'PUT', url, data });
	}

	static patch<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'PATCH', url, data });
	}

	static delete<T>(url: string, params?: object): Promise<T> {
		return ApiClient.request<T>({ method: 'DELETE', url, params });
	}
}
