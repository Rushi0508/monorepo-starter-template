import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { config } from 'src/common/env-config';

@Injectable()
export class ShopifyGraphqlClient {
	private readonly logger = new Logger(ShopifyGraphqlClient.name);

	private get graphqlEndpoint(): string {
		return `https://${config.shopify.shop}/admin/api/${config.shopify.apiVersion}/graphql.json`;
	}

	private get tokenEndpoint(): string {
		return `https://${config.shopify.shop}/admin/oauth/access_token`;
	}

	private async getAccessToken(): Promise<string> {
		const response = await axios.post<{ access_token: string }>(
			this.tokenEndpoint,
			new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: config.shopify.clientId,
				client_secret: config.shopify.clientSecret,
			}),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		);

		return response.data.access_token;
	}

	async request<T = unknown, V extends object = Record<string, unknown>>(
		operation: string,
		variables?: V
	): Promise<T> {
		const token = await this.getAccessToken();

		const response = await axios.post<{
			data: T;
			errors?: { message: string }[];
		}>(
			this.graphqlEndpoint,
			{ query: operation, variables },
			{
				headers: {
					'Content-Type': 'application/json',
					'X-Shopify-Access-Token': token,
				},
			}
		);

		if (response.data.errors?.length) {
			const messages = response.data.errors.map((e) => e.message).join(', ');
			this.logger.error(`Shopify GraphQL error: ${messages}`);
			throw new Error(`Shopify GraphQL error: ${messages}`);
		}

		return response.data.data;
	}
}
