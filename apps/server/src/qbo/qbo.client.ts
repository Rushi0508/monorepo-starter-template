import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { config } from 'src/common/env-config';
import { PrismaService } from 'src/prisma/prisma.service';

const TOKEN_ENDPOINT =
	'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const BASE_URL_PRODUCTION = 'https://quickbooks.api.intuit.com/v3/company';
const BASE_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const MINOR_VERSION = '75';

@Injectable()
export class QboClient {
	private readonly logger = new Logger(QboClient.name);

	constructor(private readonly prisma: PrismaService) {}

	private get baseUrl(): string {
		return config.qbo.environment === 'sandbox'
			? BASE_URL_SANDBOX
			: BASE_URL_PRODUCTION;
	}

	async getAuthorizationUrl(state: string): Promise<string> {
		const params = new URLSearchParams({
			client_id: config.qbo.clientId,
			scope: 'com.intuit.quickbooks.accounting',
			redirect_uri: config.qbo.redirectUri,
			response_type: 'code',
			state,
		});
		return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
	}

	async exchangeCodeForTokens(code: string, realmId: string): Promise<void> {
		const response = await axios.post(
			TOKEN_ENDPOINT,
			new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: config.qbo.redirectUri,
			}).toString(),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
					Authorization: `Basic ${Buffer.from(`${config.qbo.clientId}:${config.qbo.clientSecret}`).toString('base64')}`,
				},
			}
		);

		const { access_token, refresh_token, expires_in } = response.data;

		await this.prisma.qboConnection.upsert({
			where: { realmId },
			update: {
				accessToken: access_token,
				refreshToken: refresh_token,
				expiresAt: new Date(Date.now() + expires_in * 1000),
			},
			create: {
				realmId,
				accessToken: access_token,
				refreshToken: refresh_token,
				expiresAt: new Date(Date.now() + expires_in * 1000),
				scope: 'com.intuit.quickbooks.accounting',
			},
		});

		this.logger.log(`QBO connection established for realm ${realmId}`);
	}

	private async getValidAccessToken(realmId: string): Promise<string> {
		const connection = await this.prisma.qboConnection.findUnique({
			where: { realmId },
		});

		if (!connection) {
			throw new Error(`No QBO connection found for realm ${realmId}`);
		}

		const bufferMs = 5 * 60 * 1000;
		if (connection.expiresAt.getTime() - bufferMs > Date.now()) {
			return connection.accessToken;
		}

		this.logger.debug(`Refreshing QBO token for realm ${realmId}`);

		const response = await axios.post(
			TOKEN_ENDPOINT,
			new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: connection.refreshToken,
			}).toString(),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
					Authorization: `Basic ${Buffer.from(`${config.qbo.clientId}:${config.qbo.clientSecret}`).toString('base64')}`,
				},
			}
		);

		const { access_token, refresh_token, expires_in } = response.data;

		await this.prisma.qboConnection.update({
			where: { realmId },
			data: {
				accessToken: access_token,
				refreshToken: refresh_token,
				expiresAt: new Date(Date.now() + expires_in * 1000),
			},
		});

		return access_token;
	}

	async query<T = unknown>(realmId: string, queryStr: string): Promise<T[]> {
		const token = await this.getValidAccessToken(realmId);

		try {
			const response = await axios.get(`${this.baseUrl}/${realmId}/query`, {
				params: { query: queryStr, minorversion: MINOR_VERSION },
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
				},
			});

			const responseData = response.data?.QueryResponse;
			const entityName = queryStr.match(/FROM\s+(\w+)/i)?.[1];

			if (!entityName || !responseData?.[entityName]) {
				return [];
			}

			return responseData[entityName] as T[];
		} catch (err: any) {
			const fault = err?.response?.data?.Fault;
			if (fault) {
				const detail =
					fault.Error?.[0]?.Detail ||
					fault.Error?.[0]?.Message ||
					JSON.stringify(fault);
				this.logger.error(`QBO query failed: ${detail} | Query: "${queryStr}"`);
				throw new Error(`QBO API error: ${detail}`);
			}
			throw err;
		}
	}

	async getActiveRealmId(): Promise<string | null> {
		const connection = await this.prisma.qboConnection.findFirst({
			orderBy: { updatedAt: 'desc' },
			select: { realmId: true },
		});
		return connection?.realmId ?? null;
	}
}
