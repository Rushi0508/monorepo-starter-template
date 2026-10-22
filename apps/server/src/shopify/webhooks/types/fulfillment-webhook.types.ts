import type { WebhookLineItem } from './order-webhook.types';

export interface WebhookFulfillmentPayload {
	id: number;
	order_id: number;
	status: string;
	created_at: string;
	updated_at: string;
	tracking_company: string | null;
	tracking_number: string | null;
	tracking_numbers: string[];
	tracking_url: string | null;
	tracking_urls: string[];
	shipment_status: string | null;
	service: string | null;
	email: string | null;
	name: string | null;
	admin_graphql_api_id: string;
	line_items: WebhookLineItem[];
}
