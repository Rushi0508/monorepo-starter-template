import type { ChannelEnum, FolkMappingStatusEnum } from '@repo/enums';
import { PaginatedRequestType } from './pagination.type';

export type CustomerFilterType = {
	search?: string;
	orderDateStart?: string;
	orderDateEnd?: string;
	minOrderCount?: number;
	maxOrderCount?: number;
	states?: string[];
	channels?: ChannelEnum[];
	sortBy?:
		| 'orders'
		| 'grossRevenue'
		| 'netRevenue'
		| 'grossProfit'
		| 'netAov'
		| 'lastOrderDate';
	sortOrder?: 'asc' | 'desc';
} & PaginatedRequestType;

export type OrderFilterType = {
	search?: string;
	paymentStatus?: string[];
	fulfillmentStatus?: string[];
	skus?: string[];
	channels?: ChannelEnum[];
	orderDateStart?: string;
	orderDateEnd?: string;
	estimatedDeliveryStart?: string;
	estimatedDeliveryEnd?: string;
	deliveredAtStart?: string;
	deliveredAtEnd?: string;
	isCancelled?: boolean;
	orderType?: 'normal' | 'bundle' | 'subscription';
	sortBy?: 'date' | 'netRevenue';
	sortOrder?: 'asc' | 'desc';
} & PaginatedRequestType;

export type RevenueGroupBy = 'channel' | 'sku';

export type RevenueFilterType = {
	skus?: string[];
	channels?: ChannelEnum[];
	orderDateStart?: string;
	orderDateEnd?: string;
	chartBy?: RevenueGroupBy;
	breakdownBy?: RevenueGroupBy;
};

export type DashboardFilterType = {
	dateStart?: string;
	dateEnd?: string;
	channels?: ChannelEnum[];
};

export type FulfillmentFilterType = {
	search?: string;
	orderDateStart?: string;
	orderDateEnd?: string;
	channels?: ChannelEnum[];
	fulfillmentStatus?: string[];
	sortBy?:
		| 'totalPrice'
		| 'date'
		| 'dateOrderPicked'
		| 'dateOrderShipped'
		| 'dateOrderDelivered';
	sortOrder?: 'asc' | 'desc';
} & PaginatedRequestType;

export type UserFilterType = {
	search?: string;
} & PaginatedRequestType;

export type FolkMappingFilterType = {
	search?: string;
	status?: FolkMappingStatusEnum;
} & PaginatedRequestType;

export type DemandComparisonFilterType = {
	planAId?: string;
	planBId?: string;
};

export type DemandAccuracyFilterType = {
	/** "YYYY-MM" — the month being scored */
	demandPeriod?: string;
	/** How many months ahead the scoring forecast was made */
	lag?: number;
	channels?: ChannelEnum[];
	skuSettingIds?: string[];
};

export type InventoryGroupBy = 'sku' | 'location';

export type InventorySummaryFilterType = {
	breakdownBy?: InventoryGroupBy;
};
