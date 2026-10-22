import { deepTrim } from '@repo/utils';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios, { isAxiosError } from 'axios';
import { envConfig } from '@/env-config';
export class ApiClient {
	private static getTimezoneHeader(): Record<string, string> {
		if (typeof globalThis.window === 'undefined') return {};

		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return timeZone ? { 'x-timezone': timeZone } : {};
	}

	private static async getServerSideHeaders(): Promise<Record<string, string>> {
		if (typeof globalThis.window !== 'undefined') {
			return {};
		}

		try {
			const { cookies, headers } = await import('next/headers');
			const cookieStore = await cookies();
			const headerStore = await headers();

			const cookieHeader = cookieStore
				.getAll()
				.map((cookie: { name: string; value: string }) => {
					return `${cookie.name}=${cookie.value}`;
				})
				.join('; ');

			const serverHeaders: Record<string, string> = Object.fromEntries(
				headerStore.entries()
			);

			if (cookieHeader) {
				serverHeaders.cookie = cookieHeader;
			}

			return serverHeaders;
		} catch {
			return {};
		}
	}

	static async request<T>(config: AxiosRequestConfig): Promise<T> {
		try {
			const isFormData = config.data instanceof FormData;

			if (config.data && !isFormData) {
				config.data = deepTrim(config.data);
			}
			if (config.params) {
				config.params = deepTrim(config.params);
			}

			const serverHeaders = await ApiClient.getServerSideHeaders();

			const client = axios.create({
				baseURL: envConfig.apiUrl,
				withCredentials: true,
				headers: {
					...serverHeaders,
					...ApiClient.getTimezoneHeader(),
					...(config.data && !isFormData
						? { 'Content-Type': 'application/json' }
						: {}),
				},
				paramsSerializer: {
					serialize: (params) => {
						const searchParams = new URLSearchParams();
						Object.entries(params).forEach(([key, value]) => {
							if (value === undefined || value === null) return;
							if (Array.isArray(value)) {
								value.forEach((item) => {
									searchParams.append(key, String(item));
								});
							} else {
								searchParams.append(key, String(value));
							}
						});
						return searchParams.toString();
					},
				},
			});
			const response: AxiosResponse<T> = await client.request(config);
			return response.data;
		} catch (err) {
			if (isAxiosError(err)) {
				throw new Error(err.response?.data.message || 'Something went wrong');
			}
			console.log(err);
			throw new Error('Something went wrong');
		}
	}

	static async get<T>(
		url: string,
		params?: Record<string, unknown>
	): Promise<T> {
		return ApiClient.request<T>({ method: 'GET', url, params });
	}

	static async getBlob(
		url: string,
		params?: Record<string, unknown>
	): Promise<Blob> {
		return ApiClient.request<Blob>({
			method: 'GET',
			url,
			params,
			responseType: 'blob',
		});
	}

	static async post<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'POST', url, data });
	}

	static async put<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'PUT', url, data });
	}

	static async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
		return ApiClient.request<T>({ method: 'PATCH', url, data });
	}

	static async delete<T>(
		url: string,
		params?: Record<string, unknown>
	): Promise<T> {
		return ApiClient.request<T>({ method: 'DELETE', url, params });
	}
}
