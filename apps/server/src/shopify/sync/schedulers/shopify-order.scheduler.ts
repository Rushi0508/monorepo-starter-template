import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { ShopifyOrderSyncService } from '../services/shopify-order-sync.service';

@Injectable()
export class ShopifyOrderScheduler {
	private readonly logger = new Logger(ShopifyOrderScheduler.name);

	constructor(
		private readonly orderSync: ShopifyOrderSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_2_HOURS)
	async syncOrders(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('shopify-orders');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const since = pipeline.lastSyncedAt ?? undefined;
			await this.orderSync.syncUpdatedSince(since);
			await this.pipelineService.markSuccess(
				'shopify-orders',
				Date.now() - startTime
			);
			this.logger.log('Order reconciliation completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'shopify-orders',
				(err as Error).message
			);
			this.logger.error('Order reconciliation failed', err);
		}
	}
}
