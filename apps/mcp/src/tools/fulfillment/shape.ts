import type {
	FulfillmentOrderItem,
	GetFulfillmentResponseType,
} from '@repo/types';
import { omitNulls, round2 } from '../../lib/shape.js';
import { shapeOrderCompact, shapeOrderDetail } from '../orders/shape.js';

export function shapeFulfillmentOrder(
	order: FulfillmentOrderItem,
	opts: { includeDetail?: boolean } = {}
): Record<string, unknown> {
	const base = opts.includeDetail
		? shapeOrderDetail(order)
		: shapeOrderCompact(order);
	return omitNulls({
		...base,
		transitDays: order.transitDays,
		leadDays: order.leadDays,
	});
}

export function shapeFulfillment(
	raw: GetFulfillmentResponseType,
	opts: { includeDetail?: boolean } = {}
) {
	return omitNulls({
		metrics: omitNulls({
			avgLeadTime: round2(raw.metrics.avgLeadTime),
			avgTransitTime: round2(raw.metrics.avgTransitTime),
			onTimeRate: round2(raw.metrics.onTimeRate),
			d2cMaxTransitDays: raw.metrics.d2cMaxTransitDays,
			b2bMaxTransitDays: raw.metrics.b2bMaxTransitDays,
		}),
		orders: raw.data.map((o) => shapeFulfillmentOrder(o, opts)),
		totalCount: raw.totalCount,
		page: raw.page,
		limit: raw.limit,
	});
}
