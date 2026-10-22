import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { ShopifyInventorySyncService } from '../services/shopify-inventory-sync.service';

@Injectable()
export class ShopifyInventoryScheduler {
	private readonly logger = new Logger(ShopifyInventoryScheduler.name);

	constructor(
		private readonly inventorySync: ShopifyInventorySyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_4_HOURS)
	async syncInventory(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('shopify-inventory');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.inventorySync.syncAll();
			await this.pipelineService.markSuccess(
				'shopify-inventory',
				Date.now() - startTime
			);
			this.logger.log('Shopify inventory sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'shopify-inventory',
				(err as Error).message
			);
			this.logger.error('Shopify inventory sync failed', err);
		}
	}
}
