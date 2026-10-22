import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { BlueboxInventorySyncService } from '../services/bluebox-inventory-sync.service';

@Injectable()
export class BlueboxInventoryScheduler {
	private readonly logger = new Logger(BlueboxInventoryScheduler.name);

	constructor(
		private readonly inventorySync: BlueboxInventorySyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_7_HOURS)
	async syncInventory(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('bluebox-inventory');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.inventorySync.syncAll();
			await this.pipelineService.markSuccess(
				'bluebox-inventory',
				Date.now() - startTime
			);
			this.logger.log('BlueBox inventory sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'bluebox-inventory',
				(err as Error).message
			);
			this.logger.error('BlueBox inventory sync failed', err);
		}
	}
}
