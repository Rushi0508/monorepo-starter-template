import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionDto } from '../dto/subscription.dto';
import { extractShopifyId } from '../utils/shopify-id.utils';

@Injectable()
export class ShopifySubscriptionWebhookHandler {
	private readonly logger = new Logger(ShopifySubscriptionWebhookHandler.name);

	constructor(private readonly prisma: PrismaService) {}

	async handle(payload: SubscriptionDto): Promise<void> {
		this.logger.log(`Processing subscription webhook ${payload.contract_id}`);

		const contractId = extractShopifyId(payload.contract_id);
		const customerId = extractShopifyId(payload.customer_id);

		const customer = await this.prisma.shopifyCustomer.findUnique({
			where: { shopifyId: customerId },
		});
		if (!customer) {
			throw new Error(
				`Customer ${customerId} not found while processing subscription webhook. Contract ID: ${contractId}`
			);
		}

		const data = {
			contractId: contractId,
			status: payload.status,
			customerId: customer.id,
			nextBillingDate: payload.next_billing_date
				? new Date(payload.next_billing_date)
				: undefined,
		};

		await this.prisma.shopifySubscription.upsert({
			where: { contractId: contractId },
			update: data,
			create: data,
		});
	}

	/**
	 * The failure is already recorded against the
	 * "shopify-subscriptions-realtime" pipeline by the caller, so this only adds
	 * the payload that the pipeline's error message cannot carry.
	 */
	handleError(payload: SubscriptionDto, description: string): void {
		this.logger.error(
			`Subscription webhook failed: ${description} — payload: ${JSON.stringify(payload)}`
		);
	}
}
