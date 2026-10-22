import {
	HttpException,
	Injectable,
	Logger,
	ServiceUnavailableException,
} from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { config } from 'src/common/env-config';
import {
	assertWritableCustomFields,
	FOLK_FIELDS,
	serializeFolkValue,
} from './utils/folk-fields';

export type FolkCompany = {
	id: string;
	name: string;
	groups: { id: string; name: string }[];
	addresses: string[];
	emails: string[];
	phones: string[];
	urls: string[];
	customFieldValues: Record<string, Record<string, unknown>>;
};

export type FolkGroup = {
	id: string;
	name: string;
};

export type FolkCustomField = {
	name: string;
	type: string;
	options?: { id: string; label: string; color: string }[];
};

export type FolkPastInteraction = {
	id: string;
	dateTime?: string;
	activityType?: string;
};

type FolkListResponse<T> = {
	data: {
		items: T[];
		pagination?: { nextLink?: string };
	};
};

type FolkItemResponse<T> = {
	data: T;
};

@Injectable()
export class FolkApiClient {
	private readonly logger = new Logger(FolkApiClient.name);
	private readonly http: AxiosInstance;

	constructor() {
		this.http = axios.create({
			baseURL: config.folk.apiBaseUrl.replace(/\/$/, ''),
			timeout: 30_000,
			headers: {
				Authorization: `Bearer ${config.folk.apiKey}`,
				'Content-Type': 'application/json',
			},
		});
	}

	private ensureConfigured(): void {
		if (!config.folk.apiKey) {
			throw new ServiceUnavailableException(
				'Folk is not configured. Set FOLK_API_KEY.'
			);
		}
	}

	private async request<T>(axiosConfig: AxiosRequestConfig): Promise<T> {
		this.ensureConfigured();
		const maxAttempts = 5;
		let attempt = 0;

		while (true) {
			attempt += 1;
			try {
				const response = await this.http.request<T>(axiosConfig);
				return response.data;
			} catch (err) {
				if (!axios.isAxiosError(err)) throw err;

				const status = err.response?.status;
				const retryable =
					status === 429 ||
					(typeof status === 'number' && status >= 500) ||
					!err.response;

				if (!retryable || attempt >= maxAttempts) {
					const folkMessage =
						(err.response?.data as { error?: { message?: string } } | undefined)
							?.error?.message ?? err.message;
					throw new HttpException(`Folk API error: ${folkMessage}`, 502);
				}

				const retryAfterHeader = err.response?.headers['retry-after'];
				const resetHeader = err.response?.headers['x-ratelimit-reset'];
				let delayMs = 1000 * attempt;

				if (retryAfterHeader) {
					const retryAfter = Number.parseInt(String(retryAfterHeader), 10);
					if (Number.isFinite(retryAfter)) delayMs = retryAfter * 1000;
				} else if (resetHeader) {
					const resetAt = Number.parseInt(String(resetHeader), 10);
					if (Number.isFinite(resetAt)) {
						delayMs = Math.max(1000, resetAt * 1000 - Date.now());
					}
				}

				this.logger.warn(
					`Folk ${status ?? 'network'} — retrying in ${delayMs}ms (attempt ${attempt})`
				);
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}

	async listGroups(): Promise<FolkGroup[]> {
		const items: FolkGroup[] = [];
		let cursor: string | undefined;

		do {
			const params: Record<string, string | number> = { limit: 100 };
			if (cursor) params.cursor = cursor;

			const body = await this.request<FolkListResponse<FolkGroup>>({
				method: 'GET',
				url: '/groups',
				params,
			});
			items.push(...(body.data.items ?? []));
			const nextLink = body.data.pagination?.nextLink;
			cursor = nextLink
				? (new URL(nextLink).searchParams.get('cursor') ?? undefined)
				: undefined;
		} while (cursor);

		return items;
	}

	async listCompaniesInGroup(groupId: string): Promise<FolkCompany[]> {
		const items: FolkCompany[] = [];
		let cursor: string | undefined;

		do {
			const params: Record<string, string | number> = {
				limit: 100,
				'filter[groups][in][id]': groupId,
			};
			if (cursor) params.cursor = cursor;

			const body = await this.request<FolkListResponse<FolkCompany>>({
				method: 'GET',
				url: '/companies',
				params,
			});
			items.push(...(body.data.items ?? []));
			const nextLink = body.data.pagination?.nextLink;
			cursor = nextLink
				? (new URL(nextLink).searchParams.get('cursor') ?? undefined)
				: undefined;
		} while (cursor);

		return items;
	}

	async getCompany(companyId: string): Promise<FolkCompany> {
		const body = await this.request<FolkItemResponse<FolkCompany>>({
			method: 'GET',
			url: `/companies/${companyId}`,
		});
		return body.data;
	}

	/**
	 * PATCH custom fields. Must include the company's full `groups` list —
	 * folk requires group ids present in customFieldValues to also appear in
	 * `groups`, and `groups` uses replace semantics.
	 */
	async patchCompanyCustomFields(
		company: FolkCompany,
		groupId: string,
		fields: Record<string, string | number | null>
	): Promise<FolkCompany> {
		assertWritableCustomFields(fields);

		const serialized: Record<string, string | null> = {};
		for (const [name, value] of Object.entries(fields)) {
			serialized[name] = serializeFolkValue(name, value);
		}

		const response = await this.request<FolkItemResponse<FolkCompany>>({
			method: 'PATCH',
			url: `/companies/${company.id}`,
			data: {
				groups: company.groups.map((group) => ({ id: group.id })),
				customFieldValues: {
					[groupId]: serialized,
				},
			},
		});
		return response.data;
	}

	groupCustomFields(
		company: FolkCompany,
		groupId: string
	): Record<string, unknown> {
		return company.customFieldValues[groupId] ?? {};
	}

	readEmail(company: FolkCompany): string | null {
		return company.emails[0]?.trim() || null;
	}

	readSdCustomerId(company: FolkCompany, groupId: string): string | null {
		return this.readTextField(company, groupId, FOLK_FIELDS.sdCustomerId);
	}

	readTextField(
		company: FolkCompany,
		groupId: string,
		fieldName: string
	): string | null {
		const value = this.groupCustomFields(company, groupId)[fieldName];
		if (typeof value === 'string' && value.trim()) return value.trim();
		if (
			Array.isArray(value) &&
			typeof value[0] === 'string' &&
			value[0].trim()
		) {
			return value[0].trim();
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return String(value);
		}
		return null;
	}

	async listGroupCustomFields(
		groupId: string,
		entityType: 'company' | 'person' = 'company'
	): Promise<FolkCustomField[]> {
		const body = await this.request<{
			data: { items?: FolkCustomField[] } | FolkCustomField[];
		}>({
			method: 'GET',
			url: `/groups/${groupId}/custom-fields/${entityType}`,
		});
		if (Array.isArray(body.data)) return body.data;
		return body.data.items ?? [];
	}

	async createGroupCustomField(
		groupId: string,
		entityType: 'company' | 'person',
		definition: {
			name: string;
			type: string;
			options?: { label: string; color: string }[];
			config?: { format: string; decimals?: number; currency?: string };
		}
	): Promise<FolkCustomField> {
		const body = await this.request<FolkItemResponse<FolkCustomField>>({
			method: 'POST',
			url: `/groups/${groupId}/custom-fields/${entityType}`,
			data: definition,
		});
		return body.data;
	}

	async listPastInteractions(entityId: string): Promise<FolkPastInteraction[]> {
		const items: FolkPastInteraction[] = [];
		let cursor: string | undefined;

		do {
			const params: Record<string, string> = {
				'entity.id': entityId,
			};
			if (cursor) params.cursor = cursor;

			const body = await this.request<FolkListResponse<FolkPastInteraction>>({
				method: 'GET',
				url: '/interactions/past',
				params,
			});
			items.push(...(body.data.items ?? []));
			const nextLink = body.data.pagination?.nextLink;
			cursor = nextLink
				? (new URL(nextLink).searchParams.get('cursor') ?? undefined)
				: undefined;
		} while (cursor);

		return items;
	}
}
