import type { GetOrdersResponseType, OrderItem } from '@repo/types';
import { omitNulls, round2 } from '../../lib/shape.js';

export function shapeOrderCompact(order: OrderItem): Record<string, unknown> {
	return omitNulls({
		id: order.id,
		orderNumber: order.orderNumber,
		orderName: order.orderName,
		date: order.date,
		customerDisplayName: order.customerDisplayName,
		customerEmail: order.customerEmail,
		customerId: order.customerId,
		channel: order.channel,
		paymentStatus: order.paymentStatus,
		fulfillmentStatus: order.fulfillmentStatus,
		netRevenue: round2(order.netRevenue),
		skus: order.skus || undefined,
		cancelledAt: order.cancelledAt,
	});
}

export function shapeOrderDetail(order: OrderItem): Record<string, unknown> {
	return omitNulls({
		...shapeOrderCompact(order),
		totalPrice: round2(order.totalPrice),
		subtotalPrice: round2(order.subtotalPrice),
		totalDiscounts: round2(order.totalDiscounts),
		totalShippingPrice: round2(order.totalShippingPrice),
		currency: order.currency,
		tags: order.tags,
		note: order.note,
		shipName: order.shipName,
		shipCompany: order.shipCompany,
		shipAddress1: order.shipAddress1,
		shipAddress2: order.shipAddress2,
		shipCity: order.shipCity,
		shipProvinceCode: order.shipProvinceCode,
		shipZip: order.shipZip,
		shipCountryCode: order.shipCountryCode,
		dateOrderShipped: order.dateOrderShipped,
		dateOrderDelivered: order.dateOrderDelivered,
		estimatedDeliveryAt: order.estimatedDeliveryAt,
		lineItems: order.lineItems?.map((li) =>
			omitNulls({
				sku: li.sku,
				title: li.title,
				quantity: li.quantity,
				price: round2(li.price),
				fulfillmentStatus: li.fulfillmentStatus,
			})
		),
		fulfillments: order.fulfillments?.map((f) =>
			omitNulls({
				status: f.status,
				shipmentStatus: f.shipmentStatus,
				trackingCompany: f.trackingCompany,
				trackingNumber: f.trackingNumber,
				estimatedDeliveryAt: f.estimatedDeliveryAt,
				deliveredAt: f.deliveredAt,
			})
		),
	});
}

export function shapeOrders(
	raw: GetOrdersResponseType,
	opts: { includeDetail?: boolean } = {}
) {
	const orders = raw.data.map((o) =>
		opts.includeDetail ? shapeOrderDetail(o) : shapeOrderCompact(o)
	);

	return omitNulls({
		orders,
		totalCount: raw.totalCount,
		page: raw.page,
		limit: raw.limit,
	});
}
