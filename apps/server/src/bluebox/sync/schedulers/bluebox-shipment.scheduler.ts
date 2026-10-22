import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { BlueboxShipmentSyncService } from '../services/bluebox-shipment-sync.service';

@Injectable()
export class BlueboxShipmentScheduler {
	private readonly logger = new Logger(BlueboxShipmentScheduler.name);

	constructor(
		private readonly shipmentSync: BlueboxShipmentSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_5_HOURS)
	async syncShipments(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('bluebox-shipments');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const since = pipeline.lastSyncedAt ?? undefined;
			await this.shipmentSync.syncUpdatedSince(since);
			await this.pipelineService.markSuccess(
				'bluebox-shipments',
				Date.now() - startTime
			);
			this.logger.log('BlueBox shipment sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed(
				'bluebox-shipments',
				(err as Error).message
			);
			this.logger.error('BlueBox shipment sync failed', err);
		}
	}
}
