export const SHOPIFY_WEBHOOK_TOPICS = {
	ORDERS_CREATE: 'orders/create',
	ORDERS_UPDATED: 'orders/updated',
	ORDERS_CANCELLED: 'orders/cancelled',
	ORDERS_FULFILLED: 'orders/fulfilled',
	ORDERS_PAID: 'orders/paid',
	REFUNDS_CREATE: 'refunds/create',
	FULFILLMENTS_CREATE: 'fulfillments/create',
	FULFILLMENTS_UPDATE: 'fulfillments/update',
} as const;

export type ShopifyWebhookTopic =
	(typeof SHOPIFY_WEBHOOK_TOPICS)[keyof typeof SHOPIFY_WEBHOOK_TOPICS];
