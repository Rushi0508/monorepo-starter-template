import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { BlueboxOrderSyncService } from '../services/bluebox-order-sync.service';

@Injectable()
export class BlueboxOrderScheduler {
	private readonly logger = new Logger(BlueboxOrderScheduler.name);

	constructor(
		private readonly orderSync: BlueboxOrderSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_4_HOURS)
	async syncOrders(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('bluebox-orders');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const since = pipeline.lastSyncedAt ?? undefined;
			await this.orderSync.syncUpdatedSince(since);
			await this.pipelineService.markSuccess(
				'bluebox-orders',
				Date.now() - startTime
			);
			this.logger.log('BlueBox order sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'bluebox-orders',
				(err as Error).message
			);
			this.logger.error('BlueBox order sync failed', err);
		}
	}
}
