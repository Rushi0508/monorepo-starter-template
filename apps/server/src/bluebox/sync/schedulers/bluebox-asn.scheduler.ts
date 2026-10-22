import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { BlueboxAsnSyncService } from '../services/bluebox-asn-sync.service';

@Injectable()
export class BlueboxAsnScheduler {
	private readonly logger = new Logger(BlueboxAsnScheduler.name);

	constructor(
		private readonly asnSync: BlueboxAsnSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_7_HOURS)
	async syncAsns(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('bluebox-asns');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.asnSync.syncAsns();
			await this.pipelineService.markSuccess(
				'bluebox-asns',
				Date.now() - startTime
			);
			this.logger.log('BlueBox ASN sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'bluebox-asns',
				(err as Error).message
			);
			this.logger.error('BlueBox ASN sync failed', err);
		}
	}
}
