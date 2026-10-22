import { SOURCE_CONFIG } from '@/components/source-config';

/**
 * Deep links into the systems Sauero syncs with.
 *
 * Every base comes from SOURCE_CONFIG, so tenant ids (the Shopify store handle,
 * the Folk workspace) stay in one place instead of being spread across the
 * components that happen to render a link.
 */

const FALLBACK_URLS = {
	SHOPIFY: 'https://admin.shopify.com',
	BLUEBOX: 'https://www.blueboxlogistics.com',
	GMAIL: 'https://mail.google.com',
	FOLK: 'https://app.folk.app',
} as const;

function sourceUrl(source: keyof typeof FALLBACK_URLS): string {
	return SOURCE_CONFIG[source]?.url ?? FALLBACK_URLS[source];
}

/** Folk ids carry a `grp_`/`com_` prefix in the API, but its URLs use the bare uuid. */
function stripFolkPrefix(value: string): string {
	return value.replace(/^(grp_|com_|per_)/, '');
}

export function shopifyOrderUrl(shopifyOrderId: string | number): string {
	return `${sourceUrl('SHOPIFY')}/orders/${shopifyOrderId}`;
}

export function shopifyCustomerUrl(shopifyCustomerId: string | number): string {
	return `${sourceUrl('SHOPIFY')}/customers/${shopifyCustomerId}`;
}

export function blueboxOrderUrl(blueboxOrderId: string | number): string {
	return `${sourceUrl('BLUEBOX')}/#/apps/viewOrder/${blueboxOrderId}`;
}

export function blueboxKitOrdersUrl(): string {
	return `${sourceUrl('BLUEBOX')}/#/apps/k2Orders`;
}

/**
 * Open a Gmail thread for a specific account.
 * Uses authuser=email so multi-account sessions land on the right inbox
 * (no /u/0 hardcoding).
 */
export function gmailThreadUrl(
	threadId: string,
	accountEmail?: string | null
): string {
	const base = sourceUrl('GMAIL');
	if (accountEmail) {
		return `${base}/mail/?authuser=${encodeURIComponent(accountEmail)}#all/${threadId}`;
	}
	return `${base}/mail/#all/${threadId}`;
}

/** Folk's company card. The workspace is already part of the SOURCE_CONFIG base. */
export function folkCompanyUrl(
	folkGroupId: string,
	folkCompanyId: string
): string {
	const group = stripFolkPrefix(folkGroupId);
	const company = stripFolkPrefix(folkCompanyId);
	return `${sourceUrl('FOLK')}/groups/${group}/companies/${company}`;
}
