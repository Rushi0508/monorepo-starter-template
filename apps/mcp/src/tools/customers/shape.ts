import type {
	GetCustomerDetailResponseType,
	GetCustomersResponseType,
} from '@repo/types';
import { capArray, capWithMeta, omitNulls, round2 } from '../../lib/shape.js';
import { shapeOrderCompact, shapeOrderDetail } from '../orders/shape.js';
import {
	DEFAULT_ORDER_HISTORY,
	FULL_ORDER_HISTORY_CAP,
	SKU_VELOCITY_CAP,
} from './schema.js';

type CustomerListRow = GetCustomersResponseType['data'][number];

export function shapeCustomerListRow(
	c: CustomerListRow
): Record<string, unknown> {
	return omitNulls({
		id: c.id,
		name: c.displayName || c.name,
		company: c.company,
		email: c.email || undefined,
		phone: c.phone || undefined,
		location: c.location || undefined,
		orderCount: c.orderCount,
		netRevenue: round2(c.netRevenue),
		grossProfit: round2(c.grossProfit),
		netAov: round2(c.netAov),
		lastOrderDate: c.lastOrderDate || undefined,
	});
}

export function shapeCustomerList(raw: GetCustomersResponseType) {
	return {
		customers: raw.data.map(shapeCustomerListRow),
		totalCount: raw.totalCount,
		page: raw.page,
		limit: raw.limit,
	};
}

export function shapeCustomerDetail(
	raw: GetCustomerDetailResponseType,
	opts: { includeOrderHistory?: boolean } = {}
) {
	const historyCap = opts.includeOrderHistory
		? FULL_ORDER_HISTORY_CAP
		: DEFAULT_ORDER_HISTORY;
	const capped = capWithMeta(raw.orderHistory, historyCap);
	const history = opts.includeOrderHistory
		? capped.items.map(shapeOrderDetail)
		: capped.items.map(shapeOrderCompact);

	return omitNulls({
		id: raw.id,
		saueroCode: raw.saueroCode || undefined,
		displayName: raw.displayName,
		company: raw.company,
		email: raw.email || undefined,
		phone: raw.phone || undefined,
		tags: raw.tags,
		note: raw.note,
		folkPipelineStatus: raw.folkPipelineStatus,
		folkCustomerType: raw.folkCustomerType,
		totalOrders: raw.totalOrders,
		lastOrderDate: raw.lastOrderDate,
		grossRevenue: round2(raw.grossRevenue),
		netRevenue: round2(raw.netRevenue),
		netAov: round2(raw.netAov),
		grossProfit: round2(raw.grossProfit),
		caseVolume: raw.caseVolume,
		recentSkus: raw.recentSkus,
		skuVelocity: capArray(raw.skuVelocity, SKU_VELOCITY_CAP).map((s) =>
			omitNulls({
				sku: s.sku,
				title: s.title,
				totalUnits: s.totalUnits,
				unitsPerWeek: s.unitsPerWeek,
			})
		),
		orderHistory: history,
		orderHistoryTruncated: capped.truncated,
		defaultAddress: raw.defaultAddress
			? omitNulls({
					city: raw.defaultAddress.city,
					provinceCode: raw.defaultAddress.provinceCode,
					countryCode: raw.defaultAddress.countryCode,
					zip: raw.defaultAddress.zip,
				})
			: undefined,
	});
}
