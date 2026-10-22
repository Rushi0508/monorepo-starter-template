import { Module } from '@nestjs/common';
import { BlueBoxClient } from './bluebox.client';
import { BlueboxAsnScheduler } from './sync/schedulers/bluebox-asn.scheduler';
import { BlueboxInventoryScheduler } from './sync/schedulers/bluebox-inventory.scheduler';
import { BlueboxKitOrderScheduler } from './sync/schedulers/bluebox-kit-order.scheduler';
import { BlueboxOrderScheduler } from './sync/schedulers/bluebox-order.scheduler';
import { BlueboxShipmentScheduler } from './sync/schedulers/bluebox-shipment.scheduler';
import { BlueboxAsnSyncService } from './sync/services/bluebox-asn-sync.service';
import { BlueboxInventorySyncService } from './sync/services/bluebox-inventory-sync.service';
import { BlueboxKitOrderSyncService } from './sync/services/bluebox-kit-order-sync.service';
import { BlueboxOrderSyncService } from './sync/services/bluebox-order-sync.service';
import { BlueboxShipmentSyncService } from './sync/services/bluebox-shipment-sync.service';

@Module({
	providers: [
		BlueBoxClient,
		BlueboxInventorySyncService,
		BlueboxAsnSyncService,
		BlueboxOrderSyncService,
		BlueboxShipmentSyncService,
		BlueboxKitOrderSyncService,
		BlueboxInventoryScheduler,
		BlueboxAsnScheduler,
		BlueboxOrderScheduler,
		BlueboxShipmentScheduler,
		BlueboxKitOrderScheduler,
	],
	exports: [
		BlueBoxClient,
		BlueboxInventorySyncService,
		BlueboxAsnSyncService,
		BlueboxOrderSyncService,
		BlueboxShipmentSyncService,
		BlueboxKitOrderSyncService,
		BlueboxInventoryScheduler,
		BlueboxAsnScheduler,
		BlueboxOrderScheduler,
		BlueboxShipmentScheduler,
		BlueboxKitOrderScheduler,
	],
})
export class BlueBoxModule {}
