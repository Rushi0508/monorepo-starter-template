import { Module } from '@nestjs/common';
import { BlueBoxModule } from 'src/bluebox/bluebox.module';
import { GmailModule } from 'src/gmail/gmail.module';
import { ShopifyModule } from 'src/shopify/shopify.module';
import { SkuModule } from 'src/sku/sku.module';
import { BlueboxInventoryService } from './bluebox/bb-inventory.service';
import { InventoryController } from './inventory.controller';
import { ManuelBrothersInventoryService } from './manuel-brothers/mb-inventory.service';
import { MbReplenishmentScheduler } from './manuel-brothers/mb-replenishment.scheduler';
import { MbReplenishmentService } from './manuel-brothers/mb-replenishment.service';
import { CommonInventoryService } from './services/common.service';
import { InventorySummaryService } from './services/inventory-summary.service';

@Module({
	imports: [BlueBoxModule, ShopifyModule, GmailModule, SkuModule],
	controllers: [InventoryController],
	providers: [
		CommonInventoryService,
		InventorySummaryService,
		BlueboxInventoryService,
		ManuelBrothersInventoryService,
		MbReplenishmentService,
		MbReplenishmentScheduler,
	],
	exports: [
		CommonInventoryService,
		BlueboxInventoryService,
		ManuelBrothersInventoryService,
		MbReplenishmentService,
		MbReplenishmentScheduler,
	],
})
export class InventoryModule {}
