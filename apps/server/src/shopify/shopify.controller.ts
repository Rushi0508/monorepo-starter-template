import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { DataPipelineService } from 'src/data-pipeline/services';
import { SubscriptionDto } from './dto/subscription.dto';
import { ShopifySubscriptionWebhookHandler } from './webhooks/shopify-subscription-webhook.handler';

@Controller('shopify')
@AllowAnonymous()
@ApiTags('Shopify')
export class ShopifyController {
	constructor(
		private readonly shopifySubscriptionWebhookHandler: ShopifySubscriptionWebhookHandler,
		private readonly dataPipelineService: DataPipelineService
	) {}

	@Post('subscription/create')
	async createSubscription(@Body() subscriptionDto: SubscriptionDto) {
		const pipeline = await this.dataPipelineService.startRun(
			'shopify-subscriptions-realtime'
		);
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.shopifySubscriptionWebhookHandler.handle(subscriptionDto);
			await this.dataPipelineService.markSuccess(
				'shopify-subscriptions-realtime',
				Date.now() - startTime
			);
			console.info('Subscription created successfully');
		} catch (err) {
			await this.dataPipelineService.markFailed(
				'shopify-subscriptions-realtime',
				(err as Error).message
			);
			this.shopifySubscriptionWebhookHandler.handleError(
				subscriptionDto,
				(err as Error).message
			);
			console.error('Subscription creation failed', err);
		}
	}

	@Post('subscription/update')
	async updateSubscription(@Body() subscriptionDto: SubscriptionDto) {
		const pipeline = await this.dataPipelineService.startRun(
			'shopify-subscriptions-realtime'
		);
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.shopifySubscriptionWebhookHandler.handle(subscriptionDto);
			await this.dataPipelineService.markSuccess(
				'shopify-subscriptions-realtime',
				Date.now() - startTime
			);
			console.info('Subscription updated successfully');
		} catch (err) {
			await this.dataPipelineService.markFailed(
				'shopify-subscriptions-realtime',
				(err as Error).message
			);
			this.shopifySubscriptionWebhookHandler.handleError(
				subscriptionDto,
				(err as Error).message
			);
			console.error('Subscription update failed', err);
		}
	}
}
