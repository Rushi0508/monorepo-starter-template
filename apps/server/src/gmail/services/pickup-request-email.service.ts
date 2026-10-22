import { Injectable, Logger } from '@nestjs/common';
import {
	calculateMbPickupDate,
	formatMbPickupDate,
	MB_PICKUP_ADDRESS,
} from 'src/inventory/manuel-brothers/mb-pickup-date';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import type { GmailAttachment } from './gmail.service';
import { GmailService } from './gmail.service';

type ReplenishmentOrderForEmail = {
	id: string;
	orderNumber: string;
	createdAt: Date;
	items: { sku: string; quantity: number }[];
};

@Injectable()
export class PickupRequestEmailService {
	private readonly logger = new Logger(PickupRequestEmailService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly gmailService: GmailService
	) {}

	/**
	 * Sends the Manuel Brothers pickup request for a freshly created
	 * replenishment order, stamping the Gmail thread on the order so the
	 * acknowledgement classifier can match MB's reply back to it.
	 *
	 * Failures are logged rather than thrown so a mail problem never rolls back
	 * an order that already exists in BlueBox.
	 */
	async sendPickupRequest(
		order: ReplenishmentOrderForEmail,
		packingSlip: GmailAttachment | null
	): Promise<void> {
		const config = await this.prisma.configuration.findFirst();
		const to = config?.mbDistributorEmail?.trim();
		if (!to) {
			this.logger.warn(
				`Skipping distributor email for ${order.orderNumber}: mbDistributorEmail not configured`
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

		const pickupDate = calculateMbPickupDate(order.createdAt);
		const pickupLabel = formatMbPickupDate(pickupDate);
		const descriptions = await this.resolveProductDescriptions(
			order.items.map((i) => i.sku)
		);

		const itemLines = order.items.map((i) => {
			const desc = descriptions.get(i.sku) ?? i.sku;
			return `${desc} (${i.sku}) × ${i.quantity}`;
		});

		const subject = `Pickup request for ${pickupLabel}`;
		const text = [
			'Pickup request',
			'',
			'Items:',
			...itemLines.map((line) => `- ${line}`),
			'',
			`Pickup date: ${pickupLabel} (Monday morning)`,
			`Pickup address: ${MB_PICKUP_ADDRESS}`,
			'',
			'Please reply to this email to acknowledge.',
			'',
			`Reference: ${order.orderNumber}`,
		].join('\n');

		const html = [
			'<p><strong>Pickup request</strong></p>',
			'<p><strong>Items:</strong></p>',
			`<ul>${order.items
				.map((i) => {
					const desc = descriptions.get(i.sku) ?? i.sku;
					return `<li>${desc} (${i.sku}) × ${i.quantity}</li>`;
				})
				.join('')}</ul>`,
			`<p><strong>Pickup date:</strong> ${pickupLabel} (Monday morning)</p>`,
			`<p><strong>Pickup address:</strong> ${MB_PICKUP_ADDRESS}</p>`,
			'<p>Please reply to this email to acknowledge.</p>',
			`<p>Reference: ${order.orderNumber}</p>`,
		].join('');

		try {
			const sent = await this.gmailService.sendMessage({
				to,
				cc,
				subject,
				text,
				html,
				attachments: packingSlip ? [packingSlip] : undefined,
			});

			await this.prisma.replenishmentOrder.update({
				where: { id: order.id },
				data: {
					emailSentAt: new Date(),
					gmailThreadId: sent.threadId,
					gmailMessageId: sent.messageId,
				},
			});

			this.logger.log(
				`Distributor email sent for ${order.orderNumber} to ${to}`
			);
		} catch (err) {
			this.logger.error(
				`Failed to send distributor email for ${order.orderNumber}: ${(err as Error).message}`,
				(err as Error).stack
			);
		}
	}

	private async resolveProductDescriptions(
		skus: string[]
	): Promise<Map<string, string>> {
		const catalog = await loadSkuCatalog(this.prisma);
		const titles = new Map<string, string>();
		for (const sku of new Set(skus)) {
			const title = catalog.resolve(sku)?.title;
			if (title) titles.set(sku, title);
		}
		return titles;
	}
}
