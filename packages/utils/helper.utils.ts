import { Prisma } from '@repo/db';
import { ChannelEnum } from '@repo/enums';
import { OrderLineItem } from '@repo/types';

const WHOLESALE_ECOM_TAGS = [
	'B2B',
	'b2b',
	'B2B-Shopify',
	'wholesale',
	'Wholesale',
];

export type ChannelSource = {
	tags: string[];
	appName?: string | null;
};

const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

const hasWholesaleEcomTags = (tags: string[]): boolean => {
	const lower = tags.map((t) => t.toLowerCase());
	return lower.some((t) => WHOLESALE_ECOM_TAGS.some((sub) => t.includes(sub)));
};

/**
 * Channels whose orders reach BlueBox but are auto-cancelled there, so their
 * BlueBox status is a cancellation that never meant anything went wrong.
 */
export const BLUEBOX_NON_ELIGIBLE_CHANNELS: ReadonlySet<ChannelEnum> = new Set([
	ChannelEnum.WS_DSD,
]);

export const isBlueboxEligibleChannel = (channel: ChannelEnum): boolean =>
	!BLUEBOX_NON_ELIGIBLE_CHANNELS.has(channel);

export const isSimplyDepoApp = (appName?: string | null): boolean => {
	const normalized = normalize(appName);
	return (
		normalized.includes('simplydepo') || normalized.includes('simply depo')
	);
};

export const isPosApp = (appName?: string | null): boolean => {
	const normalized = normalize(appName);
	return normalized.includes('point of sale');
};

/**
 * Assigns the four channels Shopify can actually identify. AMAZON, WS_CHAINS
 * and ALTERNATIVE are deliberately unreachable here: nothing in an order's
 * appName or tags distinguishes them yet, so they exist for planning and
 * pricing only and report zero until a signal for them is added.
 */
export const getChannel = ({ tags, appName }: ChannelSource): ChannelEnum => {
	const app = normalize(appName);
	if (isPosApp(app)) return ChannelEnum.DTC_POS;
	if (isSimplyDepoApp(app)) {
		return ChannelEnum.WS_DSD;
	}
	if (hasWholesaleEcomTags(tags)) return ChannelEnum.WS_ECOM;
	return ChannelEnum.DTC;
};

const B2B_CHANNELS: ReadonlySet<ChannelEnum> = new Set([
	ChannelEnum.WS_ECOM,
	ChannelEnum.WS_DSD,
	ChannelEnum.WS_CHAINS,
	ChannelEnum.ALTERNATIVE,
]);

type B2BCustomerSource = { tags: string[]; orders: ChannelSource[] };

/**
 * Accepts a channel, an order (tags + appName) or a customer (their tags +
 * orders). A customer is B2B when their own tags say so or any order came
 * through a B2B channel — SimplyDepo (WS-DSD) customers carry no b2b tag.
 */
export const isB2B = (
	source: ChannelEnum | ChannelSource | B2BCustomerSource
): boolean => {
	if (typeof source === 'string') return B2B_CHANNELS.has(source);
	if ('orders' in source) {
		return (
			isB2B({ tags: source.tags }) ||
			source.orders.some((order) => isB2B(order))
		);
	}
	return B2B_CHANNELS.has(getChannel(source));
};

const posOrderWhere = (): Prisma.ShopifyOrderWhereInput => ({
	appName: { contains: 'point of sale', mode: 'insensitive' },
});

const simplyDepoOrderWhere = (): Prisma.ShopifyOrderWhereInput => ({
	OR: [
		{ appName: { contains: 'simplydepo', mode: 'insensitive' } },
		{ appName: { contains: 'simply depo', mode: 'insensitive' } },
	],
});

const channelOrderWhere = (
	channel: ChannelEnum
): Prisma.ShopifyOrderWhereInput => {
	const pos = posOrderWhere();
	const dsd = simplyDepoOrderWhere();

	switch (channel) {
		case ChannelEnum.DTC_POS:
			return pos;
		case ChannelEnum.WS_DSD:
			return dsd;
		case ChannelEnum.WS_ECOM:
			return {
				AND: [
					{ tags: { hasSome: WHOLESALE_ECOM_TAGS } },
					{ NOT: pos },
					{ NOT: dsd },
				],
			};
		case ChannelEnum.DTC:
			return {
				AND: [
					{ NOT: pos },
					{ NOT: dsd },
					{ NOT: { tags: { hasSome: WHOLESALE_ECOM_TAGS } } },
				],
			};
		// AMAZON, WS_CHAINS and ALTERNATIVE have no test in getChannel, so no
		// order ever carries them. Must match nothing rather than return {},
		// which assigns no keys and would silently drop the filter, showing
		// the whole business under a channel that has never had an order.
		default:
			return { id: { in: [] } };
	}
};

export const anyChannelOrderWhere = (
	channels: ChannelEnum[]
): Prisma.ShopifyOrderWhereInput => ({
	OR: channels.map(channelOrderWhere),
});

// Appends to AND so it cannot clobber an OR the caller sets for search.
export const applyChannelFilter = (
	where: Prisma.ShopifyOrderWhereInput,
	channels: ChannelEnum[]
): void => {
	if (channels.length === 0) return;
	const existing = where.AND ?? [];
	where.AND = [
		...(Array.isArray(existing) ? existing : [existing]),
		anyChannelOrderWhere(channels),
	];
};

/**
 * Gross revenue: product sales (unit price × quantity) plus, for whole orders,
 * the shipping charged. Tax is never revenue — it is owed to the tax authority.
 */
export const calculateGrossRevenue = ({
	lineItems,
	shipping,
}: {
	lineItems: { quantity: number; price: number }[];
	/** Shipping charged; leave out for a single product line */
	shipping?: number | null;
}): number => {
	return (
		lineItems.reduce(
			(acc, item) => acc + (item.price ?? 0) * item.quantity,
			0
		) + (shipping ?? 0)
	);
};

export const calculateNetRevenue = ({
	grossRevenue,
	totalDiscounts,
	totalRefunds,
}: {
	grossRevenue: number;
	totalDiscounts: number;
	totalRefunds: number;
}) => {
	return grossRevenue - totalDiscounts - totalRefunds;
};

/**
 * Money returned on orders, less the tax refunded on their products — tax was
 * never revenue, so returning it is not a revenue loss. Only successful refund
 * transactions count. Tax refunded on shipping is not stored, so it stays in.
 */
export const calculateTotalRefunds = ({
	refunds,
}: {
	refunds: {
		transactions: {
			amount: number | null;
			status: string | null;
		}[];
		lineItems: { totalTax: number | null }[];
	}[];
}): number => {
	return refunds.reduce((acc, refund) => {
		const returned = refund.transactions.reduce(
			(sum, transaction) =>
				transaction.status?.toLowerCase() === 'success'
					? sum + (transaction.amount ?? 0)
					: sum,
			0
		);
		const tax = refund.lineItems.reduce(
			(sum, item) => sum + (item.totalTax ?? 0),
			0
		);
		// A refund with no successful transaction returned nothing, tax included
		return acc + Math.max(0, returned - (returned > 0 ? tax : 0));
	}, 0);
};

// ─── Costs ────────────────────────────────────────────────────────────────────

/**
 * The version in force on a calendar day ("YYYY-MM-DD"): the newest one dated
 * on or before it. Effective dates are stored as UTC midnight of a calendar
 * day, so they compare by their date part.
 */
export const resolveEffectiveVersion = <
	T extends { effectiveFrom: Date | string },
>(
	versions: T[],
	dayKey: string
): T | null => {
	let effective: T | null = null;
	let effectiveKey = '';
	for (const version of versions) {
		const key = new Date(version.effectiveFrom).toISOString().slice(0, 10);
		if (key <= dayKey && key > effectiveKey) {
			effective = version;
			effectiveKey = key;
		}
	}
	return effective;
};

/** COGS for a set of line items: each unit's COGS × quantity. */
export const calculateCogs = ({
	lineItems,
}: {
	lineItems: { quantity: number; cogsPerUnit: number }[];
}): number => {
	return lineItems.reduce(
		(acc, item) => acc + item.cogsPerUnit * item.quantity,
		0
	);
};

/**
 * Fulfillment cost for one order. Storage, pick and pack are per unit, from the
 * costs entered for the order's channel. BlueBox reports only an order's actual
 * shipping, so when it has one it replaces the entered per-unit shipping.
 */
export const calculateFulfillmentCost = ({
	lineItems,
	blueboxShippingCost,
}: {
	lineItems: {
		quantity: number;
		storage: number;
		pick: number;
		pack: number;
		shipping: number;
	}[];
	blueboxShippingCost: number | null;
}): number => {
	const handling = lineItems.reduce(
		(acc, item) => acc + (item.storage + item.pick + item.pack) * item.quantity,
		0
	);
	const shipping =
		blueboxShippingCost ??
		lineItems.reduce((acc, item) => acc + item.shipping * item.quantity, 0);
	return handling + shipping;
};

/**
 * Fulfillment cost per line item, for per-SKU reporting. Same parts as
 * calculateFulfillmentCost, but BlueBox's shipping is a single charge for the
 * whole order, so it is shared across the lines by units.
 */
export const calculateLineFulfillmentCosts = ({
	lineItems,
	blueboxShippingCost,
}: {
	lineItems: {
		quantity: number;
		storage: number;
		pick: number;
		pack: number;
		shipping: number;
	}[];
	blueboxShippingCost: number | null;
}): number[] => {
	const totalUnits = lineItems.reduce((acc, item) => acc + item.quantity, 0);
	return lineItems.map((item) => {
		const handling = (item.storage + item.pick + item.pack) * item.quantity;
		const shipping =
			blueboxShippingCost === null
				? item.shipping * item.quantity
				: totalUnits > 0
					? blueboxShippingCost * (item.quantity / totalUnits)
					: 0;
		return handling + shipping;
	});
};

export const isBundleOrder = (tags: string[]) => {
	return tags.some((tag) => tag.toLowerCase().includes('bundle'));
};

export const isSubscriptionOrder = (tags: string[]) => {
	return tags.some((tag) => tag.toLowerCase().includes('subscription'));
};

export const isSubscriptionRecurringOrder = (tags: string[]) => {
	return (
		tags.some((tag) => tag.toLowerCase().includes('recurring')) &&
		isSubscriptionOrder(tags)
	);
};

const isBundleSku = (sku?: string) =>
	Boolean(sku?.toLowerCase().includes('bundle'));

const getItemDiscount = (item: {
	discountAllocations: OrderLineItem['discountAllocations'];
}) =>
	item.discountAllocations.reduce(
		(sum, allocation) =>
			sum + Number(allocation.allocatedAmountSet?.shopMoney?.amount ?? 0),
		0
	);

type BundleLineItem = {
	sku: string;
	price: number;
	quantity: number;
	totalDiscount: number;
	discountAllocations: OrderLineItem['discountAllocations'];
};

type TransformBundleResult<T> = {
	lineItems: T[];
	lineItemDiscountDelta: number;
	isBundle: boolean;
};

export function transformBundleLineItems<T extends BundleLineItem>(
	lineItems: T[]
): TransformBundleResult<T> {
	const transformed: T[] = [];
	const isBundle = isBundleOrder(lineItems.map((item) => item.sku));

	for (let i = 0; i < lineItems.length; i++) {
		const bundle = lineItems[i];

		if (!bundle) continue;

		if (!isBundleSku(bundle.sku)) {
			transformed.push(bundle);
			continue;
		}

		const bundleQty = Number(bundle.sku.match(/(\d+)PK/i)?.[1] ?? 0);

		if (!bundleQty) {
			transformed.push(bundle);
			continue;
		}

		const children = lineItems.slice(i + 1, i + 1 + bundleQty);

		if (children.length !== bundleQty) {
			transformed.push(bundle);
			continue;
		}

		const bundlePrice = bundle.price * bundle.quantity;
		const bundleDiscount = getItemDiscount(bundle);

		const totalChildGross = children.reduce(
			(sum, child) => sum + child.price * child.quantity,
			0
		);

		if (totalChildGross <= 0) {
			transformed.push(...children);
			i += bundleQty;
			continue;
		}

		let allocatedPrice = 0;
		let allocatedDiscount = 0;

		children.forEach((child, index) => {
			const childGross = child.price * child.quantity;
			const ratio = childGross / totalChildGross;

			const childPrice =
				index === children.length - 1
					? Number((bundlePrice - allocatedPrice).toFixed(2))
					: Number((bundlePrice * ratio).toFixed(2));

			const childDiscount =
				index === children.length - 1
					? Number((bundleDiscount - allocatedDiscount).toFixed(2))
					: Number((bundleDiscount * ratio).toFixed(2));

			allocatedPrice += childPrice;
			allocatedDiscount += childDiscount;

			transformed.push({
				...child,
				price: childPrice,
				totalDiscount: childDiscount,
				discountAllocations: [
					{
						allocatedAmountSet: {
							shopMoney: {
								amount: childDiscount.toFixed(2),
								currencyCode:
									child.discountAllocations[0]?.allocatedAmountSet?.shopMoney
										?.currencyCode ?? 'USD',
							},
						},
					},
				],
			});
		});

		i += bundleQty;
	}

	const originalLineItemDiscount = lineItems.reduce(
		(sum, item) => sum + getItemDiscount(item),
		0
	);

	const transformedLineItemDiscount = transformed.reduce(
		(sum, item) => sum + getItemDiscount(item),
		0
	);

	return {
		lineItems: transformed,
		lineItemDiscountDelta: Number(
			(originalLineItemDiscount - transformedLineItemDiscount).toFixed(2)
		),
		isBundle,
	};
}
