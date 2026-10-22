import { Injectable, Logger } from '@nestjs/common';
import type { InboundEmail } from '@repo/db';
import { InboundEmailStatus, InboundEmailType } from '@repo/db';
import { PickupOcrService } from 'src/llm/services/pickup-ocr.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GmailService } from './gmail.service';
import { InboundEmailService } from './inbound-email.service';

/** Shape of extractedData on a pickup email */
type PickupExtractedData = { orderNumbers: string[] };

@Injectable()
export class PickupEmailProcessService {
	private readonly logger = new Logger(PickupEmailProcessService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gmailService: GmailService,
		private readonly inboundEmailService: InboundEmailService,
		private readonly pickupOcr: PickupOcrService
	) {}

	/**
	 * Claim oldest PENDING pickup email and process it.
	 * Failures become FAILED so the scheduler skips them; retry via manual Process.
	 */
	async processNextPending(): Promise<{
		processed: boolean;
		id: string | null;
	}> {
		const id = await this.inboundEmailService.claimNextPending(
			InboundEmailType.PICKUP
		);
		if (!id) {
			return { processed: false, id: null };
		}

		const { processed } = await this.processPickupEmail(id, {
			alreadyClaimed: true,
		});
		return { processed, id };
	}

	/**
	 * OCR the MB-#### order numbers off the attachments (reusing extractedData
	 * when present) and stamp the matching replenishment orders picked up.
	 *
	 * Sets status=PROCESSED only if every order number on the document is now
	 * (or was already) confirmed. Otherwise FAILED, though any order that was
	 * ready is still confirmed.
	 */
	async processPickupEmail(
		pickupEmailId: string,
		options?: { alreadyClaimed?: boolean }
	): Promise<{ processed: boolean }> {
		const pickupEmail = await this.inboundEmailService.startProcessing(
			pickupEmailId,
			InboundEmailType.PICKUP,
			options
		);

		try {
			const orderNumbers = await this.resolveOrderNumbers(pickupEmail);
			if (!orderNumbers.length) {
				throw new Error('no MB-#### order number found on attachment(s)');
			}

			await this.confirmPickups(pickupEmail, orderNumbers);

			await this.inboundEmailService.setStatus(
				pickupEmailId,
				InboundEmailStatus.PROCESSED
			);

			this.logger.log(
				`Pickup email ${pickupEmailId} processed (${orderNumbers.join(', ')})`
			);
			return { processed: true };
		} catch (err) {
			await this.inboundEmailService.setStatus(
				pickupEmailId,
				InboundEmailStatus.FAILED
			);
			this.logger.error(
				`Pickup email ${pickupEmailId} marked FAILED: ${(err as Error).message}`,
				(err as Error).stack
			);
			return { processed: false };
		}
	}

	/** Prefer stored extractedData; otherwise OCR every attachment and persist. */
	private async resolveOrderNumbers(
		pickupEmail: InboundEmail
	): Promise<string[]> {
		const stored = pickupEmail.extractedData as PickupExtractedData | null;
		if (stored?.orderNumbers?.length) {
			this.logger.log(
				`Reusing extractedData for pickup email ${pickupEmail.id} (${stored.orderNumbers.join(', ')})`
			);
			return stored.orderNumbers;
		}

		const orderNumbers = new Set<string>();
		for (const [index, attachmentId] of pickupEmail.attachmentIds.entries()) {
			const { data } = await this.gmailService.getAttachmentData(
				pickupEmail.gmailMessageId,
				attachmentId
			);
			const found = await this.pickupOcr.extractOrderNumbers(
				data,
				pickupEmail.mimeTypes[index] ?? 'application/octet-stream'
			);
			for (const n of found) orderNumbers.add(n);
		}

		const extracted: PickupExtractedData = { orderNumbers: [...orderNumbers] };
		await this.prisma.inboundEmail.update({
			where: { id: pickupEmail.id },
			data: { extractedData: extracted },
		});

		return extracted.orderNumbers;
	}

	/**
	 * Pickup requests the team sends with this inbox CC'd land here too (our own
	 * sent mail is dropped by GmailMessageHandler), so an order is only confirmed once its pickup request
	 * email was sent and acknowledged. Confirms every order that is ready, then
	 * throws with the reasons the rest were not.
	 */
	private async confirmPickups(
		pickupEmail: InboundEmail,
		orderNumbers: string[]
	): Promise<void> {
		const orders = await this.prisma.replenishmentOrder.findMany({
			where: { orderNumber: { in: orderNumbers } },
			select: {
				id: true,
				orderNumber: true,
				emailSentAt: true,
				emailAcknowledgedAt: true,
				pickupConfirmedAt: true,
			},
		});

		const problems: string[] = [];

		const unmatched = orderNumbers.filter(
			(n) => !orders.some((o) => o.orderNumber === n)
		);
		if (unmatched.length) {
			problems.push(`no replenishment order for ${unmatched.join(', ')}`);
		}

		const confirmable: typeof orders = [];
		for (const order of orders) {
			if (order.pickupConfirmedAt) {
				this.logger.log(
					`Pickup email ${pickupEmail.id}: ${order.orderNumber} already confirmed`
				);
			} else if (!order.emailSentAt || !order.emailAcknowledgedAt) {
				problems.push(
					`${order.orderNumber} pickup request not yet sent/acknowledged, so this reads as a request, not a confirmation`
				);
			} else {
				confirmable.push(order);
			}
		}

		if (confirmable.length) {
			await this.prisma.replenishmentOrder.updateMany({
				where: {
					id: { in: confirmable.map((o) => o.id) },
					pickupConfirmedAt: null,
				},
				data: {
					pickupConfirmedAt: pickupEmail.receivedAt ?? pickupEmail.createdAt,
					pickupEmailId: pickupEmail.id,
				},
			});

			this.logger.log(
				`Pickup email ${pickupEmail.id}: pickup confirmed for ${confirmable
					.map((o) => o.orderNumber)
					.join(', ')}`
			);
		}

		if (problems.length) {
			throw new Error(problems.join('; '));
		}
	}
}
