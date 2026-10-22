export type ShopifyResourceType =
	| 'Product'
	| 'ProductVariant'
	| 'Customer'
	| 'Order'
	| 'Refund'
	| 'Fulfillment'
	| 'SubscriptionContract'
	| 'Location'
	| 'InventoryItem';

/**
 * Extracts the numeric ID string from a Shopify GraphQL GID.
 * Always store this value in the DB — it is compatible with both
 * GraphQL responses (GIDs) and webhook payloads (plain numeric strings).
 *
 * @example
 * extractShopifyId('gid://shopify/Product/440089423') // → '440089423'
 * extractShopifyId('440089423')                        // → '440089423' (no-op)
 */
export function extractShopifyId(gid: string): string {
	const parts = gid.split('/');
	return parts[parts.length - 1];
}

/**
 * Reconstructs the full GID from a stored numeric shopifyId.
 * Use this when making GraphQL API calls that require a GID argument.
 * Pass through unchanged if already a full GID (e.g. during on-demand fetches).
 *
 * @example
 * buildShopifyGid('Product', '440089423')
 * // → 'gid://shopify/Product/440089423'
 */
export function buildShopifyGid(
	resource: ShopifyResourceType,
	id: string
): string {
	if (id.startsWith('gid://')) return id;
	return `gid://shopify/${resource}/${id}`;
}
