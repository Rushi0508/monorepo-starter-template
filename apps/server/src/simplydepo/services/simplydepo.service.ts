import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import type {
	SimplyDepoCatalogProduct,
	SimplyDepoCreateFulfillmentInput,
	SimplyDepoOrder,
	SimplyDepoOrderPdfRef,
	SimplyDepoOrderProduct,
} from '@repo/types';
import axios from 'axios';
import { SIMPLYDEPO_ACTIONS } from '../constants/simplydepo.constants';
import { ZapierClient } from '../zapier.client';

type RawRecord = Record<string, unknown>;

/** A downloaded PDF, shaped to drop straight into a Gmail attachment. */
export type SimplyDepoOrderPdfFile = {
	filename: string;
	content: Buffer;
	contentType: string;
};

/**
 * Response keys that may carry the download link. `file` is what Generate Order
 * PDF actually returns; the rest are cheap insurance against Zapier renaming it.
 */
const PDF_URL_KEYS = ['file', 'file_url', 'pdf', 'pdf_url', 'url'];

/** `%PDF` — the magic bytes every PDF starts with. */
const PDF_MAGIC = '%PDF';

@Injectable()
export class SimplyDepoService {
	private readonly logger = new Logger(SimplyDepoService.name);

	constructor(private readonly zapier: ZapierClient) {}

	/** Full product catalog via Zapier Get Products. */
	async getProducts(): Promise<SimplyDepoCatalogProduct[]> {
		const { actionType, action } = SIMPLYDEPO_ACTIONS.getProducts;

		this.logger.log('Get Products');

		const raw = await this.zapier.runAction<unknown>({
			actionType,
			action,
		});

		return this.normalizeProducts(raw);
	}

	/** Find order by custom id (POD / invoice number) or throw. */
	async findOrderByCustomId(customId: string): Promise<SimplyDepoOrder> {
		const { actionType, action } = SIMPLYDEPO_ACTIONS.findOrder;

		this.logger.log(`Find Order custom_id=${customId}`);

		const raw = await this.zapier.runAction<unknown>({
			actionType,
			action,
			inputs: { custom_id: customId },
		});

		const order = this.normalizeOrders(raw)[0];
		if (!order) {
			throw new NotFoundException(
				`SimplyDepo order not found for custom_id=${customId}`
			);
		}
		return order;
	}

	/**
	 * Create fulfillment for order lines.
	 * Zapier: order_id, delivery_method, date, deliverer_name, products[{order_product_id, quantity}].
	 */
	async createFulfillment(
		input: SimplyDepoCreateFulfillmentInput
	): Promise<unknown> {
		const { actionType, action } = SIMPLYDEPO_ACTIONS.createFulfillment;

		if (!input.products?.length) {
			throw new BadRequestException(
				'Create Fulfillment requires at least one product line'
			);
		}

		this.logger.log(
			`Create Fulfillment order=${input.orderId} lines=${input.products.length}`
		);

		return this.zapier.runAction({
			actionType,
			action,
			inputs: {
				order_id: input.orderId,
				delivery_method: input.deliveryMethod,
				date: input.date,
				deliverer_name: input.delivererName,
				products: input.products.map((p) => ({
					order_product_id: p.orderProductId,
					quantity: Number(p.quantity),
				})),
			},
		});
	}

	/**
	 * Generate the order PDF via Zapier and return its bytes.
	 *
	 * The action responds with `[{ id, file, file_name }]`; `file` is a presigned
	 * S3 link that expires, so it is downloaded immediately. Zapier names the
	 * file after the order UUID, so `filename` from the caller is used instead —
	 * it is what the recipient sees on the attachment.
	 *
	 * Returns null rather than throwing when no usable PDF comes back, since
	 * callers attach it opportunistically and must still be able to proceed.
	 */
	async generateOrderPdf(
		orderId: string,
		filename: string
	): Promise<SimplyDepoOrderPdfFile | null> {
		const { actionType, action } = SIMPLYDEPO_ACTIONS.generateOrderPdf;

		this.logger.log(`Generate Order PDF order=${orderId}`);

		const raw = await this.zapier.runAction<unknown>({
			actionType,
			action,
			inputs: { order_id: orderId },
		});

		const ref = this.normalizeOrderPdfRef(raw);
		if (!ref) {
			this.logger.warn(
				`Generate Order PDF returned no file link for order=${orderId}`
			);
			return null;
		}

		const response = await axios.get<ArrayBuffer>(ref.url, {
			responseType: 'arraybuffer',
			timeout: 30_000,
		});
		const content = Buffer.from(response.data);

		// The link is presigned and short-lived; an expired one answers 200 with
		// an XML error body, so the bytes are checked rather than the status.
		if (content.subarray(0, 4).toString('latin1') !== PDF_MAGIC) {
			this.logger.warn(
				`Generate Order PDF link for order=${orderId} did not return a PDF (${content.length} bytes)`
			);
			return null;
		}

		return { filename, content, contentType: 'application/pdf' };
	}

	private normalizeOrderPdfRef(raw: unknown): SimplyDepoOrderPdfRef | null {
		const row = Array.isArray(raw) ? raw[0] : raw;
		if (!row || typeof row !== 'object') return null;

		const record = row as RawRecord;
		const url = PDF_URL_KEYS.map((key) =>
			this.asNullableString(record[key])
		).find((value) => value && /^https?:\/\//i.test(value));

		if (!url) return null;

		return {
			url,
			fileName: this.asNullableString(record.file_name ?? record.filename),
		};
	}

	private normalizeProducts(raw: unknown): SimplyDepoCatalogProduct[] {
		const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
		return rows
			.filter(
				(row): row is RawRecord => Boolean(row) && typeof row === 'object'
			)
			.map((row) => this.normalizeProduct(row))
			.filter((p) => p.id);
	}

	private normalizeProduct(row: RawRecord): SimplyDepoCatalogProduct {
		const tagsRaw = row.tags;
		const tags = Array.isArray(tagsRaw)
			? tagsRaw.map((t) => String(t)).filter(Boolean)
			: [];

		return {
			id: String(row.id ?? ''),
			name: String(row.name ?? ''),
			sku: this.asNullableString(row.sku),
			barcode: this.asNullableString(row.barcode),
			tags,
			description: this.asNullableString(row.description),
			wholesalePrice: this.asNullableNumber(row.wholesale_price),
			retailPrice: this.asNullableNumber(row.retail_price),
			costPrice: this.asNullableNumber(row.cost_price),
			itemsPerCase: this.asNullableInt(row.items_per_case),
			inventoryOnHand: this.asNullableInt(row.inventory_on_hand),
		};
	}

	private normalizeOrders(raw: unknown): SimplyDepoOrder[] {
		const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
		return rows
			.filter(
				(row): row is RawRecord => Boolean(row) && typeof row === 'object'
			)
			.map((row) => this.normalizeOrder(row));
	}

	private normalizeOrder(row: RawRecord): SimplyDepoOrder {
		const productsRaw = Array.isArray(row.products) ? row.products : [];
		return {
			id: String(row.id ?? ''),
			customId: this.asNullableString(row.custom_id),
			paymentStatus: this.asNullableString(row.payment_status),
			products: productsRaw
				.filter((p): p is RawRecord => Boolean(p) && typeof p === 'object')
				.map((p) => this.normalizeOrderProduct(p)),
		};
	}

	private normalizeOrderProduct(row: RawRecord): SimplyDepoOrderProduct {
		return {
			id: String(row.id ?? ''),
			name: String(row.name ?? ''),
			sku: this.asNullableString(row.sku),
			barcode: this.asNullableString(row.barcode),
			quantity: Number(row.quantity ?? 0),
			totalDelivered: Number(row.total_delivered ?? 0),
		};
	}

	private asNullableString(value: unknown): string | null {
		if (value == null || value === '') return null;
		return String(value);
	}

	private asNullableNumber(value: unknown): number | null {
		if (value == null || value === '') return null;
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}

	private asNullableInt(value: unknown): number | null {
		const n = this.asNullableNumber(value);
		return n == null ? null : Math.trunc(n);
	}
}
