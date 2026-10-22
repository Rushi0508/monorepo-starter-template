import { Module } from '@nestjs/common';
import { CustomerModule } from 'src/customers/customer.module';
import { FolkApiClient } from './folk.client';
import { FolkController } from './folk.controller';
import { FolkWebhookController } from './folk-webhook.controller';
import { FolkMetricsScheduler } from './schedulers/folk-metrics.scheduler';
import { FolkReconcileScheduler } from './schedulers/folk-reconcile.scheduler';
import { FolkGroupsService } from './services/folk-groups.service';
import { FolkInteractionsService } from './services/folk-interactions.service';
import { FolkMappingService } from './services/folk-mapping.service';
import { FolkMetricsService } from './services/folk-metrics.service';
import { FolkPreflightService } from './services/folk-preflight.service';
import { FolkSeedService } from './services/folk-seed.service';
import { FolkShopifyCustomersService } from './services/folk-shopify-customers.service';
import { FolkWebhookService } from './services/folk-webhook.service';

@Module({
	imports: [CustomerModule],
	controllers: [FolkController, FolkWebhookController],
	providers: [
		FolkApiClient,
		FolkGroupsService,
		FolkMappingService,
		FolkSeedService,
		FolkMetricsService,
		FolkWebhookService,
		FolkPreflightService,
		FolkInteractionsService,
		FolkMetricsScheduler,
		FolkReconcileScheduler,
		FolkShopifyCustomersService,
	],
	exports: [FolkMetricsScheduler, FolkReconcileScheduler],
})
export class FolkModule {}
