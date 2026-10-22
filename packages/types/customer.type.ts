import { ShopifyCustomerAddress } from '@repo/db';
import type { ChannelEnum } from '@repo/enums';
import type {
	CreateCustomerSchema,
	CreateSampleOrdersSchema,
	SampleOrderFormSchema,
} from '@repo/schemas';
import type z from 'zod';
import { OrderItem } from './order.type';
import { PaginatedResponseType } from './pagination.type';

export type GetCustomersResponseType = PaginatedResponseType<
	{
		id: string;
		name: string;
		email: string;
		phone: string;
		displayName: string;
		company: string | null;
		location: string;
		orderCount: number;
		caseVolume: number;
		grossRevenue: number;
		netRevenue: number;
		grossProfit: number;
		netAov: number;
		lastOrderDate: string;
		defaultAddress: ShopifyCustomerAddress | null;
	}[]
>;

export type SkuVelocityItem = {
	sku: string;
	title: string | null;
	totalUnits: number;
	unitsPerWeek: number | null;
	unitsPerStorePerWeek: number | null;
	cansPerStorePerWeek: number | null;
};

export type UpdateCustomerInput = {
	storeCount: number;
};

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export type SampleOrderFormInput = z.infer<typeof SampleOrderFormSchema>;

export type CreateSampleOrdersInput = z.infer<typeof CreateSampleOrdersSchema>;

export type SampleOrderFailedCustomerType = {
	id: string;
	name: string;
};

export type CreateSampleOrdersResponseType = {
	createdCount: number;
	failedCount: number;
	failedCustomers: SampleOrderFailedCustomerType[];
	warnings: string[];
};

export type GetCustomerDetailResponseType = {
	id: string;
	shopifyId: string;
	saueroCode: string | null;
	isB2B: boolean;
	/** Null for non-B2B customers, who have no SKU velocity. */
	storeCount: number | null;
	firstName: string;
	lastName: string;
	displayName: string;
	company: string | null;
	email: string;
	phone: string;
	note: string | null;
	tags: string[];
	channels: ChannelEnum[];
	shopifyCreatedAt: string;
	totalOrders: number;
	lastOrderDate: string | null;
	grossRevenue: number;
	netRevenue: number;
	netAov: number;
	grossProfit: number;
	totalDiscounts: number;
	caseVolume: number;
	skuVelocity: SkuVelocityItem[];
	recentSkus: string[];
	orderHistory: OrderItem[];
	defaultAddress: ShopifyCustomerAddress | null;
	folkPipelineStatus: string | null;
	folkCustomerType: string | null;
	folkGroupId: string | null;
	folkCompanyId: string | null;
	folkLastContactAt: string | null;
	folkLastContactType: string | null;
};
