import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { ShopifyCustomerSyncService } from '../services/shopify-customer-sync.service';

@Injectable()
export class ShopifyCustomerScheduler {
	private readonly logger = new Logger(ShopifyCustomerScheduler.name);

	constructor(
		private readonly customerSync: ShopifyCustomerSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_10PM, {
		timeZone: 'America/New_York',
	})
	async syncCustomers(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('shopify-customers');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.customerSync.syncAll();
			await this.pipelineService.markSuccess(
				'shopify-customers',
				Date.now() - startTime
			);
			this.logger.log('Customer sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'shopify-customers',
				(err as Error).message
			);
			this.logger.error('Customer sync failed', err);
		}
	}
}
