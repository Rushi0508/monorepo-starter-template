import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { config } from 'src/common/env-config';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import {
	SHOPIFY_WEBHOOK_TOPICS,
	type ShopifyWebhookTopic,
} from '../shopify-webhook-topics';
import { ShopifyFulfillmentWebhookHandler } from '../webhooks/shopify-fulfillment-webhook.handler';
import { ShopifyOrderWebhookHandler } from '../webhooks/shopify-order-webhook.handler';
import { ShopifyRefundWebhookHandler } from '../webhooks/shopify-refund-webhook.handler';

const supportedTopics = new Set<string>(Object.values(SHOPIFY_WEBHOOK_TOPICS));

@Injectable()
export class ShopifyConsumerService implements OnModuleInit {
	private readonly logger = new Logger(ShopifyConsumerService.name);

	private sqs = new SQSClient({
		region: config.sqs.region,
		credentials: {
			accessKeyId: config.sqs.accessKeyId,
			secretAccessKey: config.sqs.secretAccessKey,
		},
	});

	private queueUrl = config.sqs.shopifyQueueUrl;

	constructor(
		private readonly orderHandler: ShopifyOrderWebhookHandler,
		private readonly refundHandler: ShopifyRefundWebhookHandler,
		private readonly fulfillmentHandler: ShopifyFulfillmentWebhookHandler,
		private readonly pipelineService: DataPipelineService
	) {}

	async onModuleInit() {
		const isDevelopment = config.environment === 'development';
		if (!isDevelopment) {
			this.logger.log('Starting Shopify SQS consumer');
			this.pollMessages();
		} else {
			this.logger.log('Skipping Shopify SQS consumer in development mode');
		}
	}

	private async pollMessages() {
		while (true) {
			try {
				const response = await this.sqs.send(
					new ReceiveMessageCommand({
						QueueUrl: this.queueUrl,
						MaxNumberOfMessages: 10,
						WaitTimeSeconds: 20,
					})
				);

				const messages = response.Messages || [];

				for (const message of messages) {
					try {
						if (!message.Body) continue;

						const parsed = JSON.parse(message.Body);
						const topic: string =
							parsed.detail?.metadata?.['X-Shopify-Topic'] ?? '';
						const payload = parsed.detail?.payload;

						if (!topic || !payload) {
							this.logger.warn(
								'Message missing topic or payload, leaving for DLQ'
							);
							continue;
						}

						if (!supportedTopics.has(topic)) {
							this.logger.warn(`Unsupported topic "${topic}", leaving for DLQ`);
							continue;
						}

						const pipelineName = this.getPipelineNameForTopic(
							topic as ShopifyWebhookTopic
						);

						const messageStartTime = Date.now();
						await this.routeEvent(topic as ShopifyWebhookTopic, payload);
						await this.deleteMessage(message.ReceiptHandle!);

						if (pipelineName) {
							await this.pipelineService.markSuccess(
								pipelineName,
								Date.now() - messageStartTime
							);
						}

						this.logger.log(
							`Message processed, saved and deleted for topic: ${topic}`
						);
					} catch (err) {
						this.logger.error(
							`Failed to process message: ${(err as Error).message}`,
							(err as Error).stack
						);

						const parsed = message.Body ? JSON.parse(message.Body) : null;
						const failedTopic = parsed?.detail?.metadata?.['X-Shopify-Topic'];
						if (failedTopic && supportedTopics.has(failedTopic)) {
							const pipelineName = this.getPipelineNameForTopic(
								failedTopic as ShopifyWebhookTopic
							);
							if (pipelineName) {
								await this.pipelineService
									.markFailed(pipelineName, (err as Error).message)
									.catch(() => {});
							}
						}
					}
				}
			} catch (err) {
				this.logger.error('SQS polling failed', (err as Error).stack);
				await this.sleep(5000);
			}
		}
	}

	private getPipelineNameForTopic(topic: ShopifyWebhookTopic) {
		const {
			ORDERS_CREATE,
			ORDERS_UPDATED,
			ORDERS_CANCELLED,
			ORDERS_FULFILLED,
			ORDERS_PAID,
			REFUNDS_CREATE,
			FULFILLMENTS_CREATE,
			FULFILLMENTS_UPDATE,
		} = SHOPIFY_WEBHOOK_TOPICS;

		switch (topic) {
			case ORDERS_CREATE:
			case ORDERS_UPDATED:
			case ORDERS_CANCELLED:
			case ORDERS_FULFILLED:
			case ORDERS_PAID:
				return 'shopify-orders-realtime' as const;
			case REFUNDS_CREATE:
				return 'shopify-refunds-realtime' as const;
			case FULFILLMENTS_CREATE:
			case FULFILLMENTS_UPDATE:
				return 'shopify-fulfillments-realtime' as const;
			default:
				return null;
		}
	}

	private async routeEvent(
		topic: ShopifyWebhookTopic,
		payload: unknown
	): Promise<void> {
		const {
			ORDERS_CREATE,
			ORDERS_UPDATED,
			ORDERS_CANCELLED,
			ORDERS_FULFILLED,
			ORDERS_PAID,
			REFUNDS_CREATE,
			FULFILLMENTS_CREATE,
			FULFILLMENTS_UPDATE,
		} = SHOPIFY_WEBHOOK_TOPICS;

		switch (topic) {
			case ORDERS_CREATE:
			case ORDERS_UPDATED:
			case ORDERS_CANCELLED:
			case ORDERS_FULFILLED:
			case ORDERS_PAID:
				await this.orderHandler.handle(payload as any);
				break;

			case REFUNDS_CREATE:
				await this.refundHandler.handle(payload as any);
				break;

			case FULFILLMENTS_CREATE:
			case FULFILLMENTS_UPDATE:
				await this.fulfillmentHandler.handle(payload as any);
				break;
		}
	}

	private async deleteMessage(receiptHandle: string): Promise<void> {
		await this.sqs.send(
			new DeleteMessageCommand({
				QueueUrl: this.queueUrl,
				ReceiptHandle: receiptHandle,
			})
		);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
