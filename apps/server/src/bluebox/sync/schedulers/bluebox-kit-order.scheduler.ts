import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { BlueboxKitOrderSyncService } from '../services/bluebox-kit-order-sync.service';

@Injectable()
export class BlueboxKitOrderScheduler {
	private readonly logger = new Logger(BlueboxKitOrderScheduler.name);

	constructor(
		private readonly kitOrderSync: BlueboxKitOrderSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_4_HOURS)
	async syncKitOrders(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('bluebox-kit-orders');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.kitOrderSync.syncKitOrders();
			await this.pipelineService.markSuccess(
				'bluebox-kit-orders',
				Date.now() - startTime
			);
			this.logger.log('BlueBox kit order sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'bluebox-kit-orders',
				(err as Error).message
			);
			this.logger.error('BlueBox kit order sync failed', err);
		}
	}
}
