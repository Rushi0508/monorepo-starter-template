import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { FolkMetricsService } from '../services/folk-metrics.service';

@Injectable()
export class FolkMetricsScheduler {
	private readonly logger = new Logger(FolkMetricsScheduler.name);

	constructor(
		private readonly metricsService: FolkMetricsService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_2_HOURS)
	async pushMetrics(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('folk-metrics-push');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			await this.metricsService.pushMappedCompanies();
			await this.pipelineService.markSuccess(
				'folk-metrics-push',
				Date.now() - startTime
			);
			this.logger.log('Folk metrics push completed');
		} catch (err) {
			await this.pipelineService.markFailed(
				'folk-metrics-push',
				(err as Error).message
			);
			this.logger.error('Folk metrics push failed', err);
		}
	}
}
