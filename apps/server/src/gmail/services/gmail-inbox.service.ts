import {
	SendMessageBatchCommand,
	type SendMessageBatchRequestEntry,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { config } from 'src/common/env-config';
import { PrismaService } from 'src/prisma/prisma.service';
import { GmailService } from './gmail.service';

export type GmailQueueMessage = {
	gmailMessageId: string;
};

@Injectable()
export class GmailInboxService {
	private readonly logger = new Logger(GmailInboxService.name);

	private readonly sqs = new SQSClient({
		region: config.sqs.region,
		credentials: {
			accessKeyId: config.sqs.accessKeyId,
			secretAccessKey: config.sqs.secretAccessKey,
		},
	});

	constructor(
		private readonly gmailService: GmailService,
		private readonly prisma: PrismaService
	) {}

	async syncInbox(): Promise<{ enqueued: number }> {
		const connection = await this.gmailService.getConnection();
		if (!connection) {
			this.logger.debug('No Gmail connection — skipping inbox sync');
			return { enqueued: 0 };
		}

		if (!config.sqs.gmailQueueUrl) {
			this.logger.warn('SQS_GMAIL_QUEUE_URL not set — skipping inbox sync');
			return { enqueued: 0 };
		}

		if (!connection.lastHistoryId) {
			this.logger.warn(
				'Gmail connection missing lastHistoryId — reconnect Gmail to seed cursor'
			);
			return { enqueued: 0 };
		}

		return this.syncFromHistory(connection.id, connection.lastHistoryId);
	}

	private async syncFromHistory(
		connectionId: string,
		startHistoryId: string
	): Promise<{ enqueued: number }> {
		const gmail = await this.gmailService.getGmailClient();
		const messageIds = new Set<string>();
		let pageToken: string | undefined;
		let latestHistoryId = startHistoryId;

		try {
			do {
				const history = await gmail.users.history.list({
					userId: 'me',
					startHistoryId,
					historyTypes: ['messageAdded'],
					pageToken,
				});

				if (history.data.historyId) {
					latestHistoryId = history.data.historyId.toString();
				}

				for (const entry of history.data.history ?? []) {
					for (const added of entry.messagesAdded ?? []) {
						const id = added.message?.id;
						if (id) messageIds.add(id);
					}
				}

				pageToken = history.data.nextPageToken ?? undefined;
			} while (pageToken);
		} catch (err) {
			const status =
				(err as { code?: number; response?: { status?: number } })?.code ??
				(err as { response?: { status?: number } })?.response?.status;

			// Stale historyId — advance cursor to now, skip gap (no backfill)
			if (status === 404) {
				this.logger.warn(
					`Gmail historyId ${startHistoryId} expired — resetting cursor`
				);
				const profile = await gmail.users.getProfile({ userId: 'me' });
				const historyId = profile.data.historyId?.toString() ?? null;
				await this.prisma.gmailConnection.update({
					where: { id: connectionId },
					data: { lastHistoryId: historyId },
				});
				return { enqueued: 0 };
			}
			throw err;
		}

		const enqueued = await this.enqueueMessageIds([...messageIds]);

		if (latestHistoryId !== startHistoryId) {
			await this.prisma.gmailConnection.update({
				where: { id: connectionId },
				data: { lastHistoryId: latestHistoryId },
			});
		}

		if (enqueued > 0) {
			this.logger.log(
				`Gmail history sync: enqueued ${enqueued}, historyId ${startHistoryId} → ${latestHistoryId}`
			);
		}

		return { enqueued };
	}

	private async enqueueMessageIds(messageIds: string[]): Promise<number> {
		if (!messageIds.length) return 0;

		let enqueued = 0;
		for (let i = 0; i < messageIds.length; i += 10) {
			const chunk = messageIds.slice(i, i + 10);
			const entries: SendMessageBatchRequestEntry[] = chunk.map((id, idx) => {
				const body: GmailQueueMessage = { gmailMessageId: id };
				return {
					Id: `${i + idx}`,
					MessageBody: JSON.stringify(body),
				};
			});

			const result = await this.sqs.send(
				new SendMessageBatchCommand({
					QueueUrl: config.sqs.gmailQueueUrl,
					Entries: entries,
				})
			);

			enqueued += result.Successful?.length ?? 0;
			if (result.Failed?.length) {
				this.logger.error(
					`SQS batch failures: ${result.Failed.map((f) => f.Message).join('; ')}`
				);
			}
		}

		return enqueued;
	}
}
