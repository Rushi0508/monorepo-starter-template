import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { QboClient } from '../../qbo.client';
import { QboBillSyncService } from '../services/qbo-bill-sync.service';
import { QboInvoiceSyncService } from '../services/qbo-invoice-sync.service';
import { QboJournalEntrySyncService } from '../services/qbo-journal-entry-sync.service';
import { QboPaymentSyncService } from '../services/qbo-payment-sync.service';

@Injectable()
export class QboSyncScheduler {
	private readonly logger = new Logger(QboSyncScheduler.name);

	constructor(
		private readonly qboClient: QboClient,
		private readonly journalEntrySync: QboJournalEntrySyncService,
		private readonly billSync: QboBillSyncService,
		private readonly invoiceSync: QboInvoiceSyncService,
		private readonly paymentSync: QboPaymentSyncService,
		private readonly pipelineService: DataPipelineService
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_9AM, {
		timeZone: 'America/New_York',
	})
	async syncAll(): Promise<void> {
		const pipeline = await this.pipelineService.startRun('qbo-sync');
		if (!pipeline) return;

		const startTime = Date.now();
		try {
			const realmId = await this.qboClient.getActiveRealmId();
			if (!realmId) {
				this.logger.warn('No active QBO connection found, skipping sync');
				await this.pipelineService.markFailed(
					'qbo-sync',
					'No active QBO connection found'
				);
				return;
			}

			const since = pipeline.lastSyncedAt ?? undefined;

			this.logger.log(`Starting QBO sync for realm ${realmId}`);

			await this.journalEntrySync.syncUpdatedSince(realmId, since);
			await this.billSync.syncUpdatedSince(realmId, since);
			await this.invoiceSync.syncUpdatedSince(realmId, since);
			await this.paymentSync.syncUpdatedSince(realmId, since);

			await this.pipelineService.markSuccess(
				'qbo-sync',
				Date.now() - startTime
			);
			this.logger.log('QBO sync completed successfully');
		} catch (err) {
			await this.pipelineService.markFailed('qbo-sync', (err as Error).message);
			this.logger.error('QBO sync failed', err);
		}
	}
}
