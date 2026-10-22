import type { OrderItem } from './order.type';
import { PaginatedResponseType } from './pagination.type';

export type FulfillmentOrderItem = OrderItem & {
	transitDays: number | null;
	leadDays: number | null;
};

export type FulfillmentMetrics = {
	avgLeadTime: number;
	avgTransitTime: number;
	onTimeRate: number;
	d2cMaxTransitDays: number;
	b2bMaxTransitDays: number;
};

export type GetFulfillmentResponseType = {
	metrics: FulfillmentMetrics;
} & PaginatedResponseType<FulfillmentOrderItem[]>;
