export interface WebhookMoneySet {
	shop_money: { amount: string; currency_code: string };
	presentment_money: { amount: string; currency_code: string };
}

export interface WebhookAddress {
	first_name: string | null;
	last_name: string | null;
	name: string | null;
	address1: string | null;
	address2: string | null;
	city: string | null;
	province: string | null;
	province_code: string | null;
	zip: string | null;
	country: string | null;
	country_code: string | null;
	phone: string | null;
	company: string | null;
}

export interface WebhookLineItem {
	id: number;
	variant_id: number | null;
	product_id: number | null;
	title: string;
	quantity: number;
	sku: string | null;
	variant_title: string | null;
	vendor: string | null;
	price: string;
	total_discount: string;
	fulfillment_status: string | null;
	admin_graphql_api_id: string;
	price_set: WebhookMoneySet;
	total_discount_set: WebhookMoneySet;
}

export interface WebhookCustomer {
	id: number;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	admin_graphql_api_id: string;
}

export interface WebhookOrderPayload {
	id: number;
	admin_graphql_api_id: string;
	order_number: number;
	number: number;
	test: boolean;
	email: string | null;
	phone: string | null;
	note: string | null;
	note_attributes: { name: string; value: string }[];
	tags: string;
	source_name: string | null;
	financial_status: string | null;
	fulfillment_status: string | null;
	currency: string;
	subtotal_price: string;
	total_discounts: string;
	total_shipping_price_set: WebhookMoneySet;
	total_tax: string;
	total_price: string;
	current_total_price: string;
	payment_gateway_names: string[];
	cancel_reason: string | null;
	cancelled_at: string | null;
	closed_at: string | null;
	processed_at: string | null;
	created_at: string;
	updated_at: string;
	shipping_address: WebhookAddress | null;
	billing_address: WebhookAddress | null;
	customer: WebhookCustomer | null;
	line_items: WebhookLineItem[];
}
