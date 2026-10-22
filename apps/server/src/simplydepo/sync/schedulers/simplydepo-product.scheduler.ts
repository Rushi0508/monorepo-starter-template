import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { SimplyDepoProductSyncService } from '../services/simplydepo-product-sync.service';

@Injectable()
export class SimplyDepoProductScheduler {
	private readonly logger = new Logger(SimplyDepoProductScheduler.name);

	constructor(
		private readonly productSync: SimplyDepoProductSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'America/New_York',
	})
	async syncProducts(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('simplydepo-products');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const count = await this.productSync.syncAll();
			await this.pipelineService.markSuccess(
				'simplydepo-products',
				Date.now() - startTime
			);
			this.logger.log(
				`SimplyDepo product sync completed (${count} product(s))`
			);
		} catch (err) {
			await this.pipelineService.markFailed(
				'simplydepo-products',
				(err as Error).message
			);
			this.logger.error('SimplyDepo product sync failed', err);
		}
	}
}
