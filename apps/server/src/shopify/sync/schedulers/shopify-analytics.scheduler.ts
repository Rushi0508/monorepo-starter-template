import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { ShopifyAnalyticsSyncService } from '../services/shopify-analytics-sync.service';

@Injectable()
export class ShopifyAnalyticsScheduler {
	private readonly logger = new Logger(ShopifyAnalyticsScheduler.name);

	constructor(
		private readonly analyticsSync: ShopifyAnalyticsSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_10_HOURS)
	async syncAnalytics(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('shopify-analytics');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.analyticsSync.syncAll();
			await this.pipelineService.markSuccess(
				'shopify-analytics',
				Date.now() - startTime
			);
			this.logger.log('Shopify analytics sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'shopify-analytics',
				(err as Error).message
			);
			this.logger.error('Shopify analytics sync failed', err);
		}
	}
}
