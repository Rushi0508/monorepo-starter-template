import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from 'src/common/env-config';

@Injectable()
export class BlueBoxClient {
	private get baseUrl(): string {
		return config.blueBox.baseUrl;
	}

	private get authHeader(): string {
		const credentials = Buffer.from(
			`${config.blueBox.username}:${config.blueBox.password}`
		).toString('base64');
		return `Basic ${credentials}`;
	}

	private get jsonHeaders() {
		return {
			Authorization: this.authHeader,
			'Content-Type': 'application/json',
		};
	}

	async get<T = unknown>(
		url: string,
		params?: Record<string, unknown>
	): Promise<T> {
		const response = await axios.get<T>(`${this.baseUrl}${url}`, {
			params,
			headers: this.jsonHeaders,
		});

		return response.data;
	}

	/**
	 * Binary GET (e.g. packing slip PDF). Uses the same Basic auth as JSON calls.
	 */
	async getBinary(
		url: string,
		params?: Record<string, unknown>
	): Promise<{ data: Buffer; contentType: string }> {
		const response = await axios.get<ArrayBuffer>(`${this.baseUrl}${url}`, {
			params,
			headers: {
				Authorization: this.authHeader,
			},
			responseType: 'arraybuffer',
		});

		return {
			data: Buffer.from(response.data),
			contentType:
				(response.headers['content-type'] as string | undefined) ??
				'application/pdf',
		};
	}

	async post<T = unknown>(url: string, data?: unknown): Promise<T> {
		const response = await axios.post<T>(`${this.baseUrl}${url}`, data, {
			headers: this.jsonHeaders,
		});

		return response.data;
	}

	async put<T = unknown>(url: string, data?: unknown): Promise<T> {
		const response = await axios.put<T>(`${this.baseUrl}${url}`, data, {
			headers: this.jsonHeaders,
		});

		return response.data;
	}

	async delete<T = unknown>(
		url: string,
		params?: Record<string, unknown>
	): Promise<T> {
		const response = await axios.delete<T>(`${this.baseUrl}${url}`, {
			params,
			headers: this.jsonHeaders,
		});

		return response.data;
	}
}
