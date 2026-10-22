import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { SimplyDepoOrder } from '@repo/types';
import { enumToText, isSimplyDepoApp } from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import type { ShopifyOrderNodeType } from 'src/shopify/queries/order.queries';
import { SimplyDepoService } from 'src/simplydepo/services/simplydepo.service';
import type { GmailAttachment } from './gmail.service';
import { GmailService } from './gmail.service';

/** Orders older than this are treated as backfill and never emailed. */
const MAX_ORDER_AGE_MS = 24 * 60 * 60 * 1000;

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

type OrderAddress = ShopifyOrderNodeType['shippingAddress'];

/** "Account Name" — the retailer the cases are going to. */
const resolveAccountName = (node: ShopifyOrderNodeType): string => {
	const address = node.shippingAddress ?? node.billingAddress;

	return (
		address?.company?.trim() ||
		address?.name?.trim() ||
		node.email ||
		`Order #${node.number}`
	);
};

const formatAddress = (address: OrderAddress): string => {
	if (!address) return '—';

	const street = [address.address1, address.address2].filter(Boolean).join(' ');
	const region = [address.city, address.provinceCode]
		.filter(Boolean)
		.join(', ');
	return [street, region, address.zip].filter(Boolean).join(' ').trim() || '—';
};

/** "Sauero — Salted Lime, 12 oz" from the line item title + variant. */
const formatProduct = (item: {
	title: string;
	variantTitle: string | null;
}): string =>
	[item.title, item.variantTitle].filter(Boolean).join(', ') || 'Unknown item';

const formatCases = (quantity: number): string =>
	`${quantity} ${quantity === 1 ? 'case' : 'cases'}`;

/**
 * SKU for a line, taken from the SimplyDepo product (matched by name) since
 * that is the catalog the distributor picks from. Shopify's own line item SKU
 * is the fallback, and the SKU is left off the line when neither has one.
 */
const resolveSku = (
	item: { sku: string | null; title: string },
	simplyDepoOrder: SimplyDepoOrder | null
): string | null => {
	const match = simplyDepoOrder?.products.find(
		(product) =>
			product.name.trim().toLowerCase() === item.title.trim().toLowerCase()
	);
	return match?.sku?.trim() || item.sku?.trim() || null;
};

@Injectable()
export class DeliveryRequestEmailService {
	private readonly logger = new Logger(DeliveryRequestEmailService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gmailService: GmailService,
		private readonly simplyDepoService: SimplyDepoService
	) {}

	/**
	 * Sends the delivery request for a newly synced SimplyDepo (WS-DSD) order.
	 * Runs off the order sync rather than the webhook because only the GraphQL
	 * node carries the app name that identifies the SimplyDepo channel.
	 *
	 * Non-SimplyDepo and backfilled orders are ignored, and failures are logged
	 * rather than thrown so a mail problem never fails the sync.
	 *
	 * `orderId` is the persisted ShopifyOrder row, so the send can be recorded
	 * on the order's email automation timeline.
	 */
	async handleOrderCreated(
		node: ShopifyOrderNodeType,
		orderId: string
	): Promise<void> {
		try {
			if (!isSimplyDepoApp(node.app?.name ?? null)) {
				this.logger.log(
					`Skipping delivery request for #${node.number}: not a SimplyDepo order`
				);
				return;
			}

			const age = Date.now() - new Date(node.createdAt).getTime();
			if (age > MAX_ORDER_AGE_MS) {
				this.logger.log(
					`Skipping delivery request for #${node.number}: order predates the notification window`
				);
				return;
			}

			if (node.cancelledAt) {
				this.logger.log(
					`Skipping delivery request for #${node.number}: order was cancelled at ${node.cancelledAt}`
				);
				return;
			}

			const config = await this.prisma.configuration.findFirst();
			const to = config?.mbDistributorEmail?.trim();
			if (!to) {
				this.logger.warn(
					`Skipping delivery request for #${node.number}: mbDistributorEmail not configured`
				);
				return;
			}

			const cc = [
				...new Set(
					(config?.mbDistributorCcEmails ?? '')
						.split(',')
						.map((email) => email.trim())
						.filter(Boolean)
				),
			];
			// One lookup feeds three things: payment status, line SKUs, and the PDF.
			const simplyDepoOrder = await this.resolveSimplyDepoOrder(node);
			const { subject, text, html } = this.buildEmail(node, simplyDepoOrder);
			const orderPdf = await this.fetchOrderPdf(node, simplyDepoOrder);
			const { messageId, threadId } = await this.gmailService.sendMessage({
				to,
				cc,
				subject,
				text,
				html,
				attachments: orderPdf ? [orderPdf] : [],
			});

			await this.recordDeliveryRequest({ orderId, messageId, threadId });

			this.logger.log(
				`Delivery request sent for SimplyDepo order #${node.number} to ${to}` +
					(orderPdf ? ` with ${orderPdf.filename}` : ' without order PDF')
			);
		} catch (err) {
			this.logger.error(
				`Failed to send delivery request for #${node.number}: ${(err as Error).message}`,
				(err as Error).stack
			);
		}
	}

	/**
	 * Generates the SimplyDepo order PDF to attach to the delivery request.
	 *
	 * Shopify carries no SimplyDepo order id, so the order is looked up by
	 * custom_id (the Shopify order name) before Generate Order PDF can run.
	 * Any failure is logged and swallowed — the delivery request still goes out,
	 * just without the attachment.
	 */
	private async fetchOrderPdf(
		node: ShopifyOrderNodeType,
		order: SimplyDepoOrder | null
	): Promise<GmailAttachment | null> {
		if (!order) return null;

		try {
			return await this.simplyDepoService.generateOrderPdf(
				order.id,
				`order-${order.customId ?? node.number}.pdf`
			);
		} catch (err) {
			this.logger.warn(
				`Could not generate order PDF for ${node.name}: ${(err as Error).message}`
			);
			return null;
		}
	}

	/**
	 * Looks the order up in SimplyDepo, logging and returning null on failure —
	 * the delivery request still goes out, just with Shopify's payment wording
	 * and no PDF.
	 */
	private async resolveSimplyDepoOrder(
		node: ShopifyOrderNodeType
	): Promise<SimplyDepoOrder | null> {
		try {
			const order = await this.findSimplyDepoOrder(node);
			if (!order) {
				this.logger.warn(
					`No SimplyDepo order matches ${node.name}; sending delivery request without SKUs or the order PDF`
				);
			}
			return order;
		} catch (err) {
			this.logger.warn(
				`SimplyDepo lookup failed for ${node.name}: ${(err as Error).message}`
			);
			return null;
		}
	}

	/**
	 * SimplyDepo's custom_id is the bare Shopify order number — Find Order
	 * returns nothing for "#1033" but matches "1033" — so the stripped form is
	 * tried first, with the raw name kept as a fallback.
	 * Only a miss falls through to the next candidate; other Zapier errors throw.
	 */
	private async findSimplyDepoOrder(node: ShopifyOrderNodeType) {
		const candidates = [
			...new Set(
				[node.name.replace(/^#/, '').trim(), node.name.trim()].filter(Boolean)
			),
		];

		for (const customId of candidates) {
			try {
				return await this.simplyDepoService.findOrderByCustomId(customId);
			} catch (err) {
				if (!(err instanceof NotFoundException)) throw err;
			}
		}

		return null;
	}

	/** Stamps the send on the order's email automation timeline. */
	private async recordDeliveryRequest(params: {
		orderId: string;
		messageId: string;
		threadId: string;
	}): Promise<void> {
		const { orderId, messageId, threadId } = params;
		const sentAt = new Date();

		await this.prisma.orderEmailFlow.upsert({
			where: { orderId },
			create: {
				orderId,
				deliveryRequestSentAt: sentAt,
				gmailMessageId: messageId,
				gmailThreadId: threadId,
			},
			update: {
				deliveryRequestSentAt: sentAt,
				gmailMessageId: messageId,
				gmailThreadId: threadId,
			},
		});
	}

	private buildEmail(
		node: ShopifyOrderNodeType,
		simplyDepoOrder: SimplyDepoOrder | null
	) {
		const accountName = resolveAccountName(node);
		const address = formatAddress(node.shippingAddress ?? node.billingAddress);
		const items = node.lineItems.edges.map(({ node: item }) => ({
			label: formatProduct(item),
			quantity: item.currentQuantity ?? item.quantity,
			sku: resolveSku(item, simplyDepoOrder),
		}));
		const totalCases = items.reduce((sum, item) => sum + item.quantity, 0);
		// Only SimplyDepo's payment state is trustworthy here, so the line is
		// dropped rather than guessed at when the lookup came back empty.
		const payment = simplyDepoOrder?.paymentStatus
			? enumToText(simplyDepoOrder.paymentStatus)
			: null;

		/** "Salted Lime — 1 case (SKU: SAU-SL-12-12CASE)" */
		const formatLine = (item: (typeof items)[number]): string =>
			`${item.label} — ${formatCases(item.quantity)}` +
			(item.sku ? ` (SKU: ${item.sku})` : '');

		const subject = `Sauero Order — ${accountName} (Invoice ${node.name})`;

		const text = [
			'Hi,',
			'Please see the order details below.',
			`Account Name: ${accountName}`,
			`Account Address: ${address}`,
			'',
			'- Product/Qty:',
			...items.map((item) => `    - ${formatLine(item)}`),
			`- Total cases: ${totalCases}`,
			...(payment ? [`- Payment: ${payment}`] : []),
		].join('\n');

		const html = [
			'<p>Hi,</p>',
			'<p>Please see the order details below.</p>',
			`<p><strong>Account Name:</strong> ${escapeHtml(accountName)}</p>`,
			`<p><strong>Account Address:</strong> ${escapeHtml(address)}</p>`,
			'<ul>',
			'<li><strong>Product/Qty:</strong>',
			`<ul>${items
				.map((item) => `<li>${escapeHtml(formatLine(item))}</li>`)
				.join('')}</ul>`,
			'</li>',
			`<li>Total cases: ${totalCases}</li>`,
			...(payment
				? [`<li><strong>Payment:</strong> ${escapeHtml(payment)}</li>`]
				: []),
			'</ul>',
		].join('');

		return { subject, text, html };
	}
}
