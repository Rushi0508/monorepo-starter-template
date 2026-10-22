export interface ShopifyMoneyNodeType {
	amount: string;
	currencyCode: string;
}

export interface ShopifyLineItemNodeType {
	id: string;
	sku: string | null;
	title: string;
	variantTitle: string | null;
	vendor: string | null;
	quantity: number;
	currentQuantity: number;
	originalUnitPriceSet: { shopMoney: ShopifyMoneyNodeType };
	totalDiscountSet: { shopMoney: ShopifyMoneyNodeType };
	discountAllocations: {
		allocatedAmountSet: { shopMoney: ShopifyMoneyNodeType };
	}[];
	fulfillmentStatus: string | null;
	requiresShipping: boolean;
	taxable: boolean;
	isGiftCard: boolean;
	variant: { id: string } | null;
	product: { id: string } | null;
}

export interface ShopifyRefundLineItemNodeType {
	id: string;
	quantity: number;
	subtotalSet: { shopMoney: ShopifyMoneyNodeType };
	totalTaxSet: { shopMoney: ShopifyMoneyNodeType };
	lineItem: { id: string };
}

export interface ShopifyRefundTransactionNodeType {
	id: string;
	amountSet: { shopMoney: ShopifyMoneyNodeType };
	gateway: string | null;
	status: string;
	kind: string;
	createdAt: string;
}

export interface ShopifyRefundNodeType {
	id: string;
	note: string | null;
	createdAt: string;
	processedAt: string | null;
	refundLineItems: { edges: { node: ShopifyRefundLineItemNodeType }[] };
	transactions: { edges: { node: ShopifyRefundTransactionNodeType }[] };
}

export interface ShopifyFulfillmentLineItemNodeType {
	id: string;
	quantity: number;
	lineItem: { id: string };
}

export interface ShopifyFulfillmentNodeType {
	id: string;
	status: string;
	displayStatus: string | null;
	trackingInfo: {
		company: string | null;
		number: string | null;
		url: string | null;
	}[];
	estimatedDeliveryAt: string | null;
	deliveredAt: string | null;
	inTransitAt: string | null;
	createdAt: string;
	fulfillmentLineItems: {
		edges: { node: ShopifyFulfillmentLineItemNodeType }[];
	};
}

export interface ShopifyOrderNodeType {
	id: string;
	name: string;
	number: number;
	test: boolean;
	displayFinancialStatus: string | null;
	displayFulfillmentStatus: string | null;
	email: string | null;
	phone: string | null;
	note: string | null;
	customAttributes: { key: string; value: string }[];
	tags: string[];
	sourceName: string | null;
	app: { id: string; name: string } | null;
	subtotalPriceSet: { shopMoney: ShopifyMoneyNodeType };
	totalDiscountsSet: { shopMoney: ShopifyMoneyNodeType };
	totalShippingPriceSet: { shopMoney: ShopifyMoneyNodeType };
	totalTaxSet: { shopMoney: ShopifyMoneyNodeType };
	currentTotalPriceSet: { shopMoney: ShopifyMoneyNodeType };
	currencyCode: string;
	paymentGatewayNames: string[];
	paymentTerms: { translatedName: string } | null;
	cancelledAt: string | null;
	cancelReason: string | null;
	closed: boolean;
	closedAt: string | null;
	processedAt: string | null;
	createdAt: string;
	updatedAt: string;
	shippingAddress: {
		name: string | null;
		company: string | null;
		address1: string | null;
		address2: string | null;
		city: string | null;
		provinceCode: string | null;
		zip: string | null;
		countryCode: string | null;
		phone: string | null;
	} | null;
	billingAddress: {
		name: string | null;
		company: string | null;
		address1: string | null;
		address2: string | null;
		city: string | null;
		provinceCode: string | null;
		zip: string | null;
		countryCode: string | null;
		phone: string | null;
	} | null;
	customer: { id: string } | null;
	lineItems: { edges: { node: ShopifyLineItemNodeType }[] };
	refunds: ShopifyRefundNodeType[];
	fulfillments: ShopifyFulfillmentNodeType[];
}

export interface GetOrdersPageResponseType {
	orders: {
		edges: { node: ShopifyOrderNodeType }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

const ORDER_FIELDS = `
  id
  name
  number
  test
  displayFinancialStatus
  displayFulfillmentStatus
  email
  phone
  note
  customAttributes { key value }
  tags
  sourceName
  app { id name }
  subtotalPriceSet { shopMoney { amount currencyCode } }
  totalDiscountsSet { shopMoney { amount currencyCode } }
  totalShippingPriceSet { shopMoney { amount currencyCode } }
  totalTaxSet { shopMoney { amount currencyCode } }
  currentTotalPriceSet { shopMoney { amount currencyCode } }
  currencyCode
  paymentGatewayNames
  paymentTerms { translatedName }
  cancelledAt
  cancelReason
  closed
  closedAt
  processedAt
  createdAt
  updatedAt
  shippingAddress {
    name company address1 address2 city provinceCode zip countryCode: countryCodeV2 phone
  }
  billingAddress {
    name company address1 address2 city provinceCode zip countryCode: countryCodeV2 phone
  }
  customer { id }
  lineItems(first: 100) {
    edges {
      node {
        id
        sku
        title
        variantTitle
        vendor
        quantity
        currentQuantity
        originalUnitPriceSet { shopMoney { amount currencyCode } }
        totalDiscountSet { shopMoney { amount currencyCode } }
        discountAllocations { allocatedAmountSet { shopMoney { amount currencyCode } } }
        fulfillmentStatus
        requiresShipping
        taxable
        isGiftCard
        variant { id }
        product { id }
      }
    }
  }
  refunds {
    id
    note
    createdAt
    processedAt
    refundLineItems(first: 50) {
      edges {
        node {
          id
          quantity
          subtotalSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          lineItem { id }
        }
      }
    }
    transactions(first: 10) {
      edges {
        node {
          id
          amountSet { shopMoney { amount currencyCode } }
          gateway
          status
          kind
          createdAt
        }
      }
    }
  }
  fulfillments {
    id
    status
    displayStatus
    trackingInfo { company number url }
    estimatedDeliveryAt
    deliveredAt
    inTransitAt
    createdAt
    fulfillmentLineItems(first: 50) {
      edges {
        node {
          id
          quantity
          lineItem { id }
        }
      }
    }
  }
`;

export const GET_ORDERS_UPDATED_SINCE = `
  query GetOrdersUpdatedSince($query: String!, $cursor: String) {
    orders(first: 250, after: $cursor, query: $query) {
      edges {
        node {
          ${ORDER_FIELDS}
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_TEST_ORDER_IDS = `
  query GetTestOrderIds($cursor: String) {
    orders(first: 250, after: $cursor, query: "test:true") {
      nodes { id }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export interface GetTestOrderIdsResponseType {
	orders: {
		nodes: { id: string }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

export const GET_ORDER_BY_ID = `
  query GetOrderById($id: ID!) {
    order(id: $id) {
      ${ORDER_FIELDS}
    }
  }
`;

export type ShopifyMoneyBagInput = {
	shopMoney: { amount: string; currencyCode: string };
};

export type ShopifyMailingAddressInput = {
	firstName?: string | null;
	lastName?: string | null;
	company?: string | null;
	address1?: string | null;
	address2?: string | null;
	city?: string | null;
	provinceCode?: string | null;
	countryCode?: string | null;
	zip?: string | null;
	phone?: string | null;
};

export type OrderCreateLineItemInput = {
	variantId: string;
	quantity: number;
	priceSet?: ShopifyMoneyBagInput;
	requiresShipping?: boolean;
};

export type OrderCreateFinancialStatus =
	| 'PENDING'
	| 'AUTHORIZED'
	| 'PARTIALLY_PAID'
	| 'PAID'
	| 'PARTIALLY_REFUNDED'
	| 'REFUNDED'
	| 'VOIDED'
	| 'EXPIRED';

export type OrderCreateInventoryBehavior =
	| 'BYPASS'
	| 'DECREMENT_IGNORING_POLICY'
	| 'DECREMENT_OBEYING_POLICY';

export type OrderCreateVariablesType = {
	order: {
		customer?: { toAssociate: { id: string } };
		email?: string | null;
		shippingAddress?: ShopifyMailingAddressInput;
		billingAddress?: ShopifyMailingAddressInput;
		lineItems: OrderCreateLineItemInput[];
		financialStatus?: OrderCreateFinancialStatus;
		note?: string;
		tags?: string[];
	};
	options?: {
		inventoryBehaviour?: OrderCreateInventoryBehavior;
		sendReceipt?: boolean;
		sendFulfillmentReceipt?: boolean;
	};
};

export interface OrderCreateResponseType {
	orderCreate: {
		order: { id: string; name: string } | null;
		userErrors: { field: string[] | null; message: string }[];
	};
}

export const ORDER_CREATE_MUTATION = `
  mutation OrderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) {
      order {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;
