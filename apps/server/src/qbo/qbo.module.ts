import { Module } from '@nestjs/common';
import { QboClient } from './qbo.client';
import { QboController } from './qbo.controller';
import { QboSyncScheduler } from './sync/schedulers/qbo-sync.scheduler';
import { QboBillSyncService } from './sync/services/qbo-bill-sync.service';
import { QboInvoiceSyncService } from './sync/services/qbo-invoice-sync.service';
import { QboJournalEntrySyncService } from './sync/services/qbo-journal-entry-sync.service';
import { QboPaymentSyncService } from './sync/services/qbo-payment-sync.service';

@Module({
	controllers: [QboController],
	providers: [
		QboClient,
		QboJournalEntrySyncService,
		QboBillSyncService,
		QboInvoiceSyncService,
		QboPaymentSyncService,
		QboSyncScheduler,
	],
	exports: [
		QboClient,
		QboJournalEntrySyncService,
		QboBillSyncService,
		QboInvoiceSyncService,
		QboPaymentSyncService,
		QboSyncScheduler,
	],
})
export class QboModule {}
