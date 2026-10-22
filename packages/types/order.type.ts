import { OrderEmailFlow } from '@repo/db';
import {
	BlueboxWorkflowStatusEnum,
	FulfillmentStatusEnum,
	PaymentStatusEnum,
} from '@repo/enums';
import { PaginatedResponseType } from './pagination.type';

export type OrderLineItem = {
	id: string;
	sku: string | null;
	title: string | null;
	variantTitle: string | null;
	quantity: number;
	currentQuantity: number | null;
	price: number | null;
	totalDiscount: number | null;
	discountAllocations: {
		allocatedAmountSet: {
			shopMoney: {
				amount: string;
				currencyCode: string;
			};
		};
	}[];
	fulfillmentStatus: string | null;
};

export type OrderFulfillment = {
	id: string;
	shopifyId: string;
	status: string | null;
	shipmentStatus: string | null;
	trackingCompany: string | null;
	trackingNumber: string | null;
	trackingNumbers: string[];
	trackingUrl: string | null;
	trackingUrls: string[];
	estimatedDeliveryAt: string | null;
	deliveredAt: string | null;
	inTransitAt: string | null;
	createdAt: string;
};

/**
 * What one order earned after product and fulfillment costs, using each SKU's
 * costs as of the order date — the same figures the revenue page adds up.
 */
export type OrderMargin = {
	grossRevenue: number;
	discounts: number;
	refunds: number;
	netRevenue: number;
	cogs: number;
	grossProfit: number;
	grossMarginPercentage: number;
	fulfillmentCost: number;
	contributionProfit: number;
	contributionMarginPercentage: number;
};

export type OrderItem = {
	id: string;
	shopifyId: string;
	blueboxId: number | null;
	blueboxWorkflowStatus: BlueboxWorkflowStatusEnum | string | null;
	orderNumber: number;
	orderName: string | null;
	date: string | null;
	cancelledAt: string | null;
	note: string | null;
	customerId: string | null;
	customerDisplayName: string | null;
	customerEmail: string | null;
	skus: string;
	netRevenue: number | null;
	totalPrice: number | null;
	subtotalPrice: number | null;
	totalDiscounts: number | null;
	totalShippingPrice: number | null;
	totalTax: number | null;
	currency: string | null;
	paymentStatus: PaymentStatusEnum | string | null;
	fulfillmentStatus: FulfillmentStatusEnum | string | null;
	paymentGatewayNames: string[];
	channel: string | null;
	tags: string[];
	// Shipping address
	shipName: string | null;
	shipCompany: string | null;
	shipAddress1: string | null;
	shipAddress2: string | null;
	shipCity: string | null;
	shipProvinceCode: string | null;
	shipZip: string | null;
	shipCountryCode: string | null;
	shipPhone: string | null;
	// BlueBox fulfillment timeline
	dateOrderPicked: string | null;
	dateOrderShipped: string | null;
	dateOrderDelivered: string | null;
	estimatedDeliveryAt: string | null;
	/** Order-level shipping cost from Bluebox (`bluebox_orders.shippingCost`). */
	blueboxShippingCost: number | null;
	/**
	 * Automated DSD email round-trip. Only the orders endpoint populates it —
	 * null when the order has no automation row.
	 */
	emailFlow?: OrderEmailFlow | null;
	/** Set wherever the order drawer opens from; absent for cancelled orders */
	margin?: OrderMargin;
	// Line items (included for detail sheet)
	lineItems: OrderLineItem[];
	// Fulfillments with tracking info
	fulfillments: OrderFulfillment[];
};

export type GetOrdersResponseType = PaginatedResponseType<OrderItem[]>;
