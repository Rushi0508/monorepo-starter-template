import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { GmailInboxService } from '../services/gmail-inbox.service';

@Injectable()
export class GmailInboxScheduler {
	private readonly logger = new Logger(GmailInboxScheduler.name);

	constructor(
		private readonly inboxService: GmailInboxService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async syncInbox(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('gmail-inbox');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const { enqueued } = await this.inboxService.syncInbox();
			await this.pipelineService.markSuccess(
				'gmail-inbox',
				Date.now() - startTime
			);
			if (enqueued > 0) {
				this.logger.log(`Gmail inbox sync enqueued ${enqueued} message(s)`);
			}
		} catch (err) {
			await this.pipelineService.markFailed(
				'gmail-inbox',
				(err as Error).message
			);
			this.logger.error('Gmail inbox sync failed', err);
		}
	}
}
