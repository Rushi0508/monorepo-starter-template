import type { WebhookLineItem, WebhookMoneySet } from './order-webhook.types';

export interface WebhookRefundLineItem {
	id: number;
	quantity: number;
	line_item_id: number;
	location_id: number | null;
	restock_type: string;
	subtotal: number;
	total_tax: number;
	subtotal_set: WebhookMoneySet;
	total_tax_set: WebhookMoneySet;
	line_item: WebhookLineItem;
}

export interface WebhookOrderAdjustment {
	id: number;
	order_id: number;
	refund_id: number;
	amount: string;
	tax_amount: string;
	kind: string;
	reason: string | null;
	amount_set: WebhookMoneySet;
	tax_amount_set: WebhookMoneySet;
}

export interface WebhookTransaction {
	id: number;
	order_id: number;
	kind: string;
	gateway: string;
	status: string;
	amount: string;
	currency: string;
	created_at: string;
	admin_graphql_api_id: string;
}

export interface WebhookRefundPayload {
	id: number;
	order_id: number;
	created_at: string;
	note: string | null;
	user_id: number | null;
	processed_at: string;
	restock: boolean;
	admin_graphql_api_id: string;
	refund_line_items: WebhookRefundLineItem[];
	transactions: WebhookTransaction[];
	order_adjustments: WebhookOrderAdjustment[];
}
