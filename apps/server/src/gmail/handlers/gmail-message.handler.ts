import { Injectable, Logger } from '@nestjs/common';
import { POD_OCR_MIME_TYPES } from '@repo/constants';
import { InboundEmailType } from '@repo/db';
import type { gmail_v1 } from 'googleapis';
import { ReplenishmentAckClassifierService } from 'src/llm/services/replenishment-ack-classifier.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GmailService } from '../services/gmail.service';

type OcrAttachment = {
	attachmentId: string;
	filename: string;
	mimeType: string;
};

@Injectable()
export class GmailMessageHandler {
	private readonly logger = new Logger(GmailMessageHandler.name);

	constructor(
		private readonly gmailService: GmailService,
		private readonly prisma: PrismaService,
		private readonly ackClassifier: ReplenishmentAckClassifierService
	) {}

	/** Subject must contain whole-word "pod" or "pods" (e.g. "SAUERO PODS <date>"). */
	private isPodSubject(subject: string | null): boolean {
		if (!subject) return false;
		return /\bpods?\b/i.test(subject);
	}

	/** Subject must contain "pickup" / "pick up" / "pick-up" (e.g. "Sauero Pickup MB-0008"). */
	private isPickupSubject(subject: string | null): boolean {
		if (!subject) return false;
		return /\bpick[\s-]*ups?\b/i.test(subject);
	}

	/**
	 * Messages sent from this inbox are skipped. Otherwise checks run top to
	 * bottom and the first one that acts on the message wins:
	 * replenishment ack → pickup email → POD email.
	 */
	async handle(gmailMessageId: string): Promise<void> {
		const gmail = await this.gmailService.getGmailClient();
		const { data: message } = await gmail.users.messages.get({
			userId: 'me',
			id: gmailMessageId,
			format: 'full',
		});

		// Mail sent from this inbox (our pickup requests carry the packing slip and
		// a "pickup" subject) must never be read as an inbound ack, pickup or POD
		if (message.labelIds?.includes('SENT')) {
			this.logger.debug(`Skip ${gmailMessageId}: sent from this inbox`);
			return;
		}

		const subject = this.header(message.payload?.headers ?? [], 'Subject');
		const plain =
			this.findPartBody(message.payload, 'text/plain') ||
			this.stripHtml(this.findPartBody(message.payload, 'text/html') || '') ||
			message.snippet ||
			'';

		const acknowledged = await this.tryAcknowledgeReplenishmentEmail({
			gmailMessageId,
			threadId: message.threadId ?? null,
			subject,
			body: plain,
		});
		if (acknowledged) return;

		const pickupStored = await this.tryStorePickupEmail(
			gmailMessageId,
			message,
			subject
		);
		if (pickupStored) return;

		await this.tryStorePodEmail(gmailMessageId, message, subject);
	}

	/**
	 * Store a pickup email ("pickup" subject + OCR-able attachments) as PENDING;
	 * PickupEmailProcessService OCRs it and confirms the replenishment order.
	 * Returns true once stored.
	 */
	private async tryStorePickupEmail(
		gmailMessageId: string,
		message: gmail_v1.Schema$Message,
		subject: string | null
	): Promise<boolean> {
		if (!this.isPickupSubject(subject)) return false;

		const attachments = this.collectOcrAttachments(message.payload);
		if (!attachments.length) {
			this.logger.log(
				`Pickup email ${gmailMessageId} has no PDF/image attachment; not a pickup confirmation`
			);
			return false;
		}

		await this.storeInboundEmail(
			InboundEmailType.PICKUP,
			gmailMessageId,
			message,
			subject,
			attachments
		);
		return true;
	}

	/** Store a POD email (whole-word POD/PODS subject + OCR-able attachments) as PENDING. */
	private async tryStorePodEmail(
		gmailMessageId: string,
		message: gmail_v1.Schema$Message,
		subject: string | null
	): Promise<void> {
		if (!this.isPodSubject(subject)) {
			this.logger.debug(
				`Skip POD store ${gmailMessageId}: subject has no whole-word POD/PODS`
			);
			return;
		}

		const attachments = this.collectOcrAttachments(message.payload);
		if (!attachments.length) {
			this.logger.debug(`Skip ${gmailMessageId}: no OCR-supported attachments`);
			return;
		}

		await this.storeInboundEmail(
			InboundEmailType.POD,
			gmailMessageId,
			message,
			subject,
			attachments
		);
	}

	private async storeInboundEmail(
		type: InboundEmailType,
		gmailMessageId: string,
		message: gmail_v1.Schema$Message,
		subject: string | null,
		attachments: OcrAttachment[]
	): Promise<void> {
		const fields = {
			threadId: message.threadId ?? null,
			from: this.header(message.payload?.headers ?? [], 'From'),
			subject,
			snippet: message.snippet ?? null,
			body: this.extractBody(message.payload),
			receivedAt: message.internalDate
				? new Date(Number(message.internalDate))
				: null,
			attachmentIds: attachments.map((a) => a.attachmentId),
			filenames: attachments.map((a) => a.filename),
			mimeTypes: attachments.map((a) => a.mimeType),
		};

		// Type and status are only set on first sight, so a redelivered message
		// never resets an email that has already been processed
		await this.prisma.inboundEmail.upsert({
			where: { gmailMessageId },
			create: { gmailMessageId, type, ...fields },
			update: fields,
		});

		this.logger.log(
			`Stored ${type} email ${gmailMessageId} with ${attachments.length} attachment(s)`
		);
	}

	/**
	 * Match reply by Gmail threadId, then LLM-classify whether it is a real ack
	 * (vs a question / clarification). Skip our own outbound message id.
	 * Returns true once the reply is recorded as an ack.
	 */
	private async tryAcknowledgeReplenishmentEmail(input: {
		gmailMessageId: string;
		threadId: string | null;
		subject: string | null;
		body: string;
	}): Promise<boolean> {
		if (!input.threadId) return false;

		const order = await this.prisma.replenishmentOrder.findFirst({
			where: {
				gmailThreadId: input.threadId,
				emailAcknowledgedAt: null,
				emailSentAt: { not: null },
			},
			include: { items: true },
		});

		if (!order) return false;

		// Skip our own outbound message
		if (order.gmailMessageId && order.gmailMessageId === input.gmailMessageId) {
			return false;
		}

		const body = input.body.trim();
		if (!body) {
			this.logger.debug(`Skip ack for ${order.orderNumber}: empty reply body`);
			return false;
		}

		try {
			const classification = await this.ackClassifier.classify({
				orderNumber: order.orderNumber,
				subject: input.subject,
				body,
				items: order.items.map((i) => ({
					sku: i.sku,
					quantity: i.quantity,
				})),
			});

			if (!classification.isAcknowledgement) {
				this.logger.log(
					`Reply on ${order.orderNumber} not an ack: ${classification.reason}`
				);
				return false;
			}

			await this.prisma.replenishmentOrder.update({
				where: { id: order.id },
				data: { emailAcknowledgedAt: new Date() },
			});

			this.logger.log(
				`Replenishment order ${order.orderNumber} email acknowledged (thread ${input.threadId}): ${classification.reason}`
			);
			return true;
		} catch (err) {
			this.logger.error(
				`Failed to classify ack for ${order.orderNumber}: ${(err as Error).message}`,
				(err as Error).stack
			);
			return false;
		}
	}

	private stripHtml(html: string): string {
		return html
			.replace(/<style[\s\S]*?<\/style>/gi, ' ')
			.replace(/<script[\s\S]*?<\/script>/gi, ' ')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	private header(
		headers: gmail_v1.Schema$MessagePartHeader[],
		name: string
	): string | null {
		const value = headers.find(
			(h) => h.name?.toLowerCase() === name.toLowerCase()
		)?.value;
		return value ?? null;
	}

	private extractBody(
		part: gmail_v1.Schema$MessagePart | undefined
	): string | null {
		if (!part) return null;

		const html = this.findPartBody(part, 'text/html');
		if (html) return html;

		return this.findPartBody(part, 'text/plain');
	}

	private findPartBody(
		part: gmail_v1.Schema$MessagePart | undefined,
		mimeType: string
	): string | null {
		if (!part) return null;

		if (part.mimeType === mimeType && part.body?.data) {
			return this.decodeBase64Url(part.body.data);
		}

		for (const child of part.parts ?? []) {
			const found = this.findPartBody(child, mimeType);
			if (found) return found;
		}

		return null;
	}

	private decodeBase64Url(data: string): string {
		const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
		return Buffer.from(normalized, 'base64').toString('utf8');
	}

	private collectOcrAttachments(
		part: gmail_v1.Schema$MessagePart | undefined
	): OcrAttachment[] {
		if (!part) return [];

		const results: OcrAttachment[] = [];
		const walk = (node: gmail_v1.Schema$MessagePart) => {
			const filename = node.filename || 'attachment';
			const mimeType = node.mimeType || null;
			const attachmentId = node.body?.attachmentId;

			if (
				attachmentId &&
				mimeType &&
				(POD_OCR_MIME_TYPES as readonly string[]).includes(mimeType)
			) {
				results.push({ attachmentId, filename, mimeType });
			}

			for (const child of node.parts ?? []) {
				walk(child);
			}
		};

		walk(part);
		return results;
	}
}
