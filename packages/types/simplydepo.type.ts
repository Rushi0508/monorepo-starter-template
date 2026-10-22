/** Catalog product from Zapier Get Products (`get_products`). */
export type SimplyDepoCatalogProduct = {
	id: string;
	name: string;
	sku: string | null;
	barcode: string | null;
	tags: string[];
	description: string | null;
	wholesalePrice: number | null;
	retailPrice: number | null;
	costPrice: number | null;
	itemsPerCase: number | null;
	inventoryOnHand: number | null;
};

/** Line item on a SimplyDepo order (`products[]` from Find Order). */
export type SimplyDepoOrderProduct = {
	/** Order line id — Create Fulfillment `order_product_id`. */
	id: string;
	name: string;
	sku: string | null;
	barcode: string | null;
	quantity: number;
	totalDelivered: number;
};

/** SimplyDepo order from Zapier Find Order. */
export type SimplyDepoOrder = {
	id: string;
	customId: string | null;
	/** SimplyDepo's own payment state, e.g. "PAID" / "PENDING". */
	paymentStatus: string | null;
	products: SimplyDepoOrderProduct[];
};

/** One line to fulfill — Zapier `products` fieldset row. */
export type SimplyDepoFulfillmentProductInput = {
	orderProductId: string;
	quantity: number;
};

/**
 * Create Fulfillment via Zapier.
 * Fields: order_id, delivery_method, date, deliverer_name, products[{order_product_id,quantity}]
 */
export type SimplyDepoCreateFulfillmentInput = {
	orderId: string;
	deliveryMethod: string;
	date: string;
	delivererName: string;
	products: SimplyDepoFulfillmentProductInput[];
};

/**
 * Generated order PDF from Zapier Generate Order PDF (`generate_order_pdf`).
 * The action responds with `[{ id, file, file_name }]`, where `file` is a
 * short-lived presigned S3 link that needs no auth header to download.
 */
export type SimplyDepoOrderPdfRef = {
	url: string;
	/** Zapier's own name, e.g. `order-report-<uuid>.pdf`. */
	fileName: string | null;
};
