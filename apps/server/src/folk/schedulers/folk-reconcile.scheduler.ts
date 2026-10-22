import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { FolkInteractionsService } from '../services/folk-interactions.service';
import { FolkMetricsService } from '../services/folk-metrics.service';
import { FolkSeedService } from '../services/folk-seed.service';
import { FolkShopifyCustomersService } from '../services/folk-shopify-customers.service';

@Injectable()
export class FolkReconcileScheduler {
	private readonly logger = new Logger(FolkReconcileScheduler.name);

	constructor(
		private readonly seedService: FolkSeedService,
		private readonly metricsService: FolkMetricsService,
		private readonly interactionsService: FolkInteractionsService,
		private readonly shopifyCustomersService: FolkShopifyCustomersService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_1AM, {
		timeZone: 'America/New_York',
	})
	async reconcile(): Promise<void> {
		const pipeline = await this.pipelineService.startRun(
			'folk-nightly-reconcile'
		);
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.seedService.seed();
			await this.shopifyCustomersService.pushUnmappedCompanies();
			await this.metricsService.pushMappedCompanies();
			await this.interactionsService.syncMappedCompanies();
			await this.pipelineService.markSuccess(
				'folk-nightly-reconcile',
				Date.now() - startTime
			);
			this.logger.log('Folk nightly reconcile completed');
		} catch (err) {
			await this.pipelineService.markFailed(
				'folk-nightly-reconcile',
				(err as Error).message
			);
			this.logger.error('Folk nightly reconcile failed', err);
		}
	}
}
