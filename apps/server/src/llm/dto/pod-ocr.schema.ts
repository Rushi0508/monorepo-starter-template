import { z } from 'zod';

const AddressSchema = z.object({
	name: z.string().nullable().describe('Company or person name'),
	street: z.string().nullable().describe('Street address line(s)'),
	city: z.string().nullable(),
	state: z.string().nullable().describe('State or province code'),
	zip: z.string().nullable().describe('ZIP / postal code'),
	country: z.string().nullable(),
});

const ContactSchema = z.object({
	name: z.string().nullable().describe('Contact person full name'),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	role: z.string().nullable().describe('Title / role if mentioned'),
});

const LineItemSchema = z.object({
	lineNumber: z.number().nullable().describe('Row number on the invoice'),
	productName: z
		.string()
		.nullable()
		.describe('Product name / description as printed'),
	sku: z.string().nullable().describe('SKU or product code if present'),
	upc: z.string().nullable().describe('UPC / barcode digits if present'),
	cases: z.number().describe('Number of cases'),
	itemsPerCase: z.number().nullable().describe('Items per case if listed'),
	listPricePerCase: z
		.number()
		.nullable()
		.describe('Original list price per case'),
	pricePaidPerCase: z
		.number()
		.nullable()
		.describe('Actual price paid per case (after discount)'),
	totalPrice: z.number().nullable().describe('Line total'),
});

export const PODOcrSchema = z.object({
	invoiceNumber: z
		.string()
		.nullable()
		.describe('Invoice or order number (SimplyDepo custom_id)'),
	orderDate: z
		.string()
		.nullable()
		.describe('Order date as it appears on the document'),
	paymentTerms: z
		.string()
		.nullable()
		.describe('Payment terms (e.g. "Advance payment", "Net 30")'),
	totalCases: z.number().nullable().describe('Total cases on the invoice'),
	customerNumber: z
		.string()
		.nullable()
		.describe('Customer number / Cust No if present'),

	billingAddress: AddressSchema.nullable(),
	shippingAddress: AddressSchema.nullable(),
	customerContact: ContactSchema.nullable(),

	lineItems: z.array(LineItemSchema).describe('Itemised product rows'),

	subtotal: z.number().nullable(),
	discounts: z
		.number()
		.nullable()
		.describe('Total discount amount (positive value)'),
	deliveryCharges: z.number().nullable(),
	grandTotal: z.number().nullable(),

	fulfillByDate: z
		.string()
		.nullable()
		.describe('Required fulfillment / ship-by date if present'),
	notes: z
		.string()
		.nullable()
		.describe(
			'Any handwritten notes, annotations, or corrections visible on the document'
		),
});

export type PODOcrResult = z.infer<typeof PODOcrSchema>;
export type PODOcrBatchResult = PODOcrResult[];
export type PODOcrLineItem = z.infer<typeof LineItemSchema>;
