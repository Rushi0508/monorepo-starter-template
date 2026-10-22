import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { ShopifyProductSyncService } from '../services/shopify-product-sync.service';

@Injectable()
export class ShopifyProductScheduler {
	private readonly logger = new Logger(ShopifyProductScheduler.name);

	constructor(
		private readonly productSync: ShopifyProductSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'America/New_York',
	})
	async syncProducts(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('shopify-products');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.productSync.syncAll();
			await this.pipelineService.markSuccess(
				'shopify-products',
				Date.now() - startTime
			);
			this.logger.log('Product sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'shopify-products',
				(err as Error).message
			);
			this.logger.error('Product sync failed', err);
		}
	}
}
