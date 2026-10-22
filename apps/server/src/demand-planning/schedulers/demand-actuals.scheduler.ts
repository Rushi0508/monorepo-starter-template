import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { DemandActualsService } from '../services/demand-actuals.service';

@Injectable()
export class DemandActualsScheduler {
	private readonly logger = new Logger(DemandActualsScheduler.name);

	constructor(
		private readonly actuals: DemandActualsService,
		private readonly pipelineService: DataPipelineService
	) {}

	/**
	 * A full rebuild rather than an incremental one: refunds and cancellations
	 * land against months that closed long ago, so anything scoped to "since the
	 * last run" would leave those months quietly wrong.
	 */
	@Cron(CronExpression.EVERY_6_HOURS)
	async refreshActuals(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('demand-actuals');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const { rows, months } = await this.actuals.refresh();
			await this.pipelineService.markSuccess(
				'demand-actuals',
				Date.now() - startTime
			);
			this.logger.log(`Demand actuals: ${rows} rows across ${months} months`);
		} catch (err) {
			await this.pipelineService.markFailed(
				'demand-actuals',
				(err as Error).message
			);
			this.logger.error('Demand actuals refresh failed', err);
		}
	}
}
