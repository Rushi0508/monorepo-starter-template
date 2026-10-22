import axios from 'axios';
import { config } from '../../common/env-config';

export async function getShopifyAccessToken(): Promise<string> {
	const response = await axios.post<{ access_token: string }>(
		`https://${config.shopify.shop}/admin/oauth/access_token`,
		new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: config.shopify.clientId,
			client_secret: config.shopify.clientSecret,
		}),
		{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
	);

	return response.data.access_token;
}

export async function shopifyGraphqlRequest<T = unknown>(
	operation: string,
	variables?: Record<string, unknown>
): Promise<T> {
	const token = await getShopifyAccessToken();

	const response = await axios.post<{
		data: T;
		errors?: { message: string }[];
	}>(
		`https://${config.shopify.shop}/admin/api/${config.shopify.apiVersion}/graphql.json`,
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
		throw new Error(`Shopify GraphQL error: ${messages}`);
	}

	return response.data.data;
}
