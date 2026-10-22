import { Module } from '@nestjs/common';
import { SimplyDepoService } from './services/simplydepo.service';
import { SimplyDepoProductScheduler } from './sync/schedulers/simplydepo-product.scheduler';
import { SimplyDepoProductSyncService } from './sync/services/simplydepo-product-sync.service';
import { ZapierClient } from './zapier.client';

@Module({
	providers: [
		ZapierClient,
		SimplyDepoService,
		SimplyDepoProductSyncService,
		SimplyDepoProductScheduler,
	],
	exports: [
		SimplyDepoService,
		SimplyDepoProductSyncService,
		SimplyDepoProductScheduler,
	],
})
export class SimplyDepoModule {}
