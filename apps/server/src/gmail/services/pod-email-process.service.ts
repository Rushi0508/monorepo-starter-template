import { Injectable, Logger } from '@nestjs/common';
import type { InboundEmail, Prisma } from '@repo/db';
import { InboundEmailStatus, InboundEmailType } from '@repo/db';
import { ChannelEnum } from '@repo/enums';
import { applyChannelFilter } from '@repo/utils';
import type { PODOcrResult } from 'src/llm/dto/pod-ocr.schema';
import { PodLineMapperService } from 'src/llm/services/pod-line-mapper.service';
import { PodOcrService } from 'src/llm/services/pod-ocr.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	SIMPLYDEPO_DELIVERER_NAME,
	SIMPLYDEPO_DELIVERY_METHOD,
} from 'src/simplydepo/constants/simplydepo.constants';
import { SimplyDepoService } from 'src/simplydepo/services/simplydepo.service';
import { GmailService } from './gmail.service';
import { InboundEmailService } from './inbound-email.service';

@Injectable()
export class PodEmailProcessService {
	private readonly logger = new Logger(PodEmailProcessService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gmailService: GmailService,
		private readonly inboundEmailService: InboundEmailService,
		private readonly podOcrService: PodOcrService,
		private readonly simplyDepoService: SimplyDepoService,
		private readonly lineMapper: PodLineMapperService
	) {}

	/**
	 * Claim oldest PENDING POD email and process it.
	 * Failures become FAILED so the scheduler skips them; retry via manual Process.
	 */
	async processNextPending(): Promise<{
		processed: boolean;
		id: string | null;
	}> {
		const id = await this.inboundEmailService.claimNextPending(
			InboundEmailType.POD
		);
		if (!id) {
			return { processed: false, id: null };
		}

		const { processed } = await this.processPodEmail(id, {
			alreadyClaimed: true,
		});
		return { processed, id };
	}

	/**
	 * OCR every attachment → persist extractedData → find order → LLM map → fulfill.
	 * Reuses existing extractedData when present (skip OCR).
	 * Sets status=PROCESSED only if every step succeeds.
	 */
	async processPodEmail(
		podEmailId: string,
		options?: { alreadyClaimed?: boolean }
	): Promise<{ processed: boolean }> {
		const podEmail = await this.inboundEmailService.startProcessing(
			podEmailId,
			InboundEmailType.POD,
			options
		);

		try {
			const allDocs = await this.resolvePodDocuments(podEmail);

			for (const doc of allDocs) {
				await this.fulfillPodDocument(doc, podEmail);
			}

			await this.inboundEmailService.setStatus(
				podEmailId,
				InboundEmailStatus.PROCESSED
			);

			this.logger.log(
				`POD email ${podEmailId} processed (${podEmail.attachmentIds.length} attachment(s), ${allDocs.length} POD(s))`
			);
			return { processed: true };
		} catch (err) {
			await this.inboundEmailService.setStatus(
				podEmailId,
				InboundEmailStatus.FAILED
			);
			this.logger.error(
				`POD email ${podEmailId} marked FAILED: ${(err as Error).message}`,
				(err as Error).stack
			);
			return { processed: false };
		}
	}

	/** Prefer stored extractedData; otherwise OCR all attachments and persist. */
	private async resolvePodDocuments(
		podEmail: InboundEmail
	): Promise<PODOcrResult[]> {
		const stored = podEmail.extractedData;
		if (Array.isArray(stored) && stored.length > 0) {
			this.logger.log(
				`Reusing extractedData for POD email ${podEmail.id} (${stored.length} doc(s))`
			);
			return stored as PODOcrResult[];
		}

		const allDocs: PODOcrResult[] = [];
		for (let i = 0; i < podEmail.attachmentIds.length; i++) {
			const docs = await this.ocrAttachment(podEmail, i);
			allDocs.push(...docs);
		}

		await this.prisma.inboundEmail.update({
			where: { id: podEmail.id },
			data: { extractedData: allDocs as Prisma.InputJsonValue },
		});

		return allDocs;
	}

	private async ocrAttachment(
		podEmail: InboundEmail,
		index: number
	): Promise<PODOcrResult[]> {
		const attachmentId = podEmail.attachmentIds[index];
		const mimeType = podEmail.mimeTypes[index] ?? 'application/octet-stream';
		const filename = podEmail.filenames[index] ?? `attachment-${index + 1}`;

		if (!attachmentId) {
			throw new Error(`Missing attachmentId at index ${index}`);
		}

		const { data: buffer } = await this.gmailService.getAttachmentData(
			podEmail.gmailMessageId,
			attachmentId
		);

		const documents = await this.podOcrService.parsePod(buffer, mimeType);
		this.logger.log(`OCR ${filename}: ${documents.length} document(s)`);
		return documents;
	}

	private async fulfillPodDocument(
		doc: PODOcrResult,
		podEmail: InboundEmail
	): Promise<void> {
		const invoiceNumber = doc.invoiceNumber?.trim();
		if (!invoiceNumber) {
			throw new Error('OCR document missing invoiceNumber');
		}
		if (!doc.lineItems?.length) {
			throw new Error(`OCR #${invoiceNumber}: no line items`);
		}

		// Link the POD to its Shopify order up front so the order's email
		// timeline shows the POD as received even if fulfillment later fails
		const shopifyOrderId = await this.recordPodReceived(
			invoiceNumber,
			podEmail
		);

		const order =
			await this.simplyDepoService.findOrderByCustomId(invoiceNumber);

		const orderRemaining = order.products.reduce(
			(sum, p) => sum + Math.max(0, p.quantity - p.totalDelivered),
			0
		);
		if (orderRemaining <= 0) {
			this.logger.log(
				`SimplyDepo order custom_id=${invoiceNumber} already fulfilled; skip Create Fulfillment`
			);
			// Nothing left to push — whether it was fulfilled by hand in SimplyDepo
			// or by an earlier pass over this POD, the loop is closed for this
			// order, so the timeline is stamped rather than left open forever.
			await this.recordPodProcessed(shopifyOrderId);
			return;
		}

		const mapped = await this.lineMapper.mapLines({
			ocrLines: doc.lineItems,
			orderProducts: order.products,
		});

		const productsById = new Map(order.products.map((p) => [p.id, p]));
		const products = mapped.mappings
			.map((m) => {
				const line = productsById.get(m.orderProductId);
				const remaining = line
					? Math.max(0, line.quantity - line.totalDelivered)
					: 0;
				return {
					orderProductId: m.orderProductId,
					quantity: Math.min(m.quantity, remaining),
				};
			})
			.filter((p) => p.quantity > 0);

		if (!products.length) {
			throw new Error(
				`OCR #${invoiceNumber}: mapped lines have no remaining qty to fulfill`
			);
		}

		const fulfillmentDate =
			this.toIsoDate(doc.fulfillByDate) ??
			this.toIsoDate(doc.orderDate) ??
			new Date().toISOString().slice(0, 10);

		await this.simplyDepoService.createFulfillment({
			orderId: order.id,
			deliveryMethod: SIMPLYDEPO_DELIVERY_METHOD,
			delivererName: SIMPLYDEPO_DELIVERER_NAME,
			date: fulfillmentDate,
			products,
		});

		await this.recordPodProcessed(shopifyOrderId);

		this.logger.log(
			`Fulfilled SimplyDepo order custom_id=${invoiceNumber} (${products.length} line(s))`
		);
	}

	/**
	 * Matches the OCR'd invoice number back to its Shopify order and stamps the
	 * POD as received. The invoice number is the SimplyDepo custom_id, which is
	 * carried on the WS-DSD order as its Shopify order name ("1028", no "#").
	 * Returns null when no order matches — POD processing still runs, it just
	 * isn't surfaced on an order.
	 */
	private async recordPodReceived(
		invoiceNumber: string,
		podEmail: InboundEmail
	): Promise<string | null> {
		const orderId = await this.findShopifyOrderId(invoiceNumber);
		if (!orderId) {
			this.logger.warn(
				`No Shopify order matches invoice ${invoiceNumber}; POD not linked to an order`
			);
			return null;
		}

		const receivedAt = podEmail.receivedAt ?? podEmail.createdAt;

		await this.prisma.orderEmailFlow.upsert({
			where: { orderId },
			create: { orderId, podReceivedAt: receivedAt, podEmailId: podEmail.id },
			update: { podReceivedAt: receivedAt, podEmailId: podEmail.id },
		});

		return orderId;
	}

	private async recordPodProcessed(orderId: string | null): Promise<void> {
		if (!orderId) return;

		await this.prisma.orderEmailFlow.update({
			where: { orderId },
			data: { podProcessedAt: new Date() },
		});
	}

	/**
	 * The search is scoped to the WS-DSD channel because SimplyDepo's custom_id
	 * shares a numbering space with Shopify's order numbers: SimplyDepo invoice
	 * 1028 and Shopify order #1028 are unrelated orders that both exist. Matching
	 * on orderNumber, or on a "#"-prefixed name, lands the POD on the Shopify
	 * order and leaves the real one stuck on "Awaiting POD".
	 */
	private async findShopifyOrderId(
		invoiceNumber: string
	): Promise<string | null> {
		const customId = invoiceNumber.replace(/^#/, '').trim();
		if (!customId) return null;

		// SimplyDepo order names are the bare custom_id; "#" is tolerated only
		// because the channel filter has already ruled out Shopify's own orders.
		const where: Prisma.ShopifyOrderWhereInput = {
			orderName: { in: [customId, `#${customId}`] },
		};
		applyChannelFilter(where, [ChannelEnum.WS_DSD]);

		const order = await this.prisma.shopifyOrder.findFirst({
			where,
			select: { id: true },
		});

		return order?.id ?? null;
	}

	private toIsoDate(value: string | null): string | null {
		if (!value) return null;
		const trimmed = value.trim();
		if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
			return trimmed.slice(0, 10);
		}
		const parsed = new Date(trimmed);
		if (Number.isNaN(parsed.getTime())) return null;
		return parsed.toISOString().slice(0, 10);
	}
}
