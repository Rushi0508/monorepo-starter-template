import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { config } from 'src/common/env-config';
import { GmailMessageHandler } from '../handlers/gmail-message.handler';
import type { GmailQueueMessage } from '../services/gmail-inbox.service';

@Injectable()
export class GmailEventsConsumer implements OnModuleInit {
	private readonly logger = new Logger(GmailEventsConsumer.name);

	private readonly sqs = new SQSClient({
		region: config.sqs.region,
		credentials: {
			accessKeyId: config.sqs.accessKeyId,
			secretAccessKey: config.sqs.secretAccessKey,
		},
	});

	constructor(private readonly messageHandler: GmailMessageHandler) {}

	async onModuleInit() {
		if (!config.sqs.gmailQueueUrl) {
			this.logger.log('SQS_GMAIL_QUEUE_URL not set — skipping Gmail consumer');
			return;
		}

		if (config.environment === 'development') {
			this.logger.log('Skipping Gmail SQS consumer in development mode');
			return;
		}

		this.logger.log('Starting Gmail SQS consumer');
		this.pollMessages();
	}

	private async pollMessages() {
		while (true) {
			try {
				const response = await this.sqs.send(
					new ReceiveMessageCommand({
						QueueUrl: config.sqs.gmailQueueUrl,
						MaxNumberOfMessages: 10,
						WaitTimeSeconds: 20,
					})
				);

				for (const message of response.Messages ?? []) {
					try {
						if (!message.Body || !message.ReceiptHandle) continue;

						const parsed = JSON.parse(message.Body) as GmailQueueMessage;
						if (!parsed.gmailMessageId) {
							this.logger.warn('Gmail SQS message missing gmailMessageId');
							continue;
						}

						await this.messageHandler.handle(parsed.gmailMessageId);
						await this.sqs.send(
							new DeleteMessageCommand({
								QueueUrl: config.sqs.gmailQueueUrl,
								ReceiptHandle: message.ReceiptHandle,
							})
						);
					} catch (err) {
						this.logger.error(
							`Failed to process Gmail message: ${(err as Error).message}`,
							(err as Error).stack
						);
					}
				}
			} catch (err) {
				this.logger.error(
					`Gmail SQS poll error: ${(err as Error).message}`,
					(err as Error).stack
				);
				await new Promise((r) => setTimeout(r, 5000));
			}
		}
	}
}
