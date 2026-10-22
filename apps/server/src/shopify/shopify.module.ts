import { Module } from '@nestjs/common';
import { GmailModule } from 'src/gmail/gmail.module';
import { ShopifyConsumerService } from './consumers/shopify-events.consumer';
import { ShopifyController } from './shopify.controller';
import { ShopifyGraphqlClient } from './shopify-graphql.client';
import { ShopifyAnalyticsScheduler } from './sync/schedulers/shopify-analytics.scheduler';
import { ShopifyCustomerScheduler } from './sync/schedulers/shopify-customer.scheduler';
import { ShopifyInventoryScheduler } from './sync/schedulers/shopify-inventory.scheduler';
import { ShopifyOrderScheduler } from './sync/schedulers/shopify-order.scheduler';
import { ShopifyProductScheduler } from './sync/schedulers/shopify-product.scheduler';
import { ShopifyAnalyticsSyncService } from './sync/services/shopify-analytics-sync.service';
import { ShopifyCustomerSyncService } from './sync/services/shopify-customer-sync.service';
import { ShopifyInventorySyncService } from './sync/services/shopify-inventory-sync.service';
import { ShopifyOrderSyncService } from './sync/services/shopify-order-sync.service';
import { ShopifyProductSyncService } from './sync/services/shopify-product-sync.service';
import { ShopifyFulfillmentWebhookHandler } from './webhooks/shopify-fulfillment-webhook.handler';
import { ShopifyOrderWebhookHandler } from './webhooks/shopify-order-webhook.handler';
import { ShopifyRefundWebhookHandler } from './webhooks/shopify-refund-webhook.handler';
import { ShopifySubscriptionWebhookHandler } from './webhooks/shopify-subscription-webhook.handler';

@Module({
	imports: [GmailModule],
	providers: [
		// Core
		ShopifyGraphqlClient,
		ShopifyConsumerService,
		// Sync services
		ShopifyProductSyncService,
		ShopifyCustomerSyncService,
		ShopifyOrderSyncService,
		ShopifyAnalyticsSyncService,
		ShopifyInventorySyncService,
		// Webhook handlers
		ShopifyOrderWebhookHandler,
		ShopifyRefundWebhookHandler,
		ShopifyFulfillmentWebhookHandler,
		ShopifySubscriptionWebhookHandler,
		// Schedulers
		ShopifyProductScheduler,
		ShopifyCustomerScheduler,
		ShopifyOrderScheduler,
		ShopifyAnalyticsScheduler,
		ShopifyInventoryScheduler,
	],
	exports: [
		ShopifyGraphqlClient,
		ShopifyProductSyncService,
		ShopifyCustomerSyncService,
		ShopifyOrderSyncService,
		ShopifyAnalyticsSyncService,
		ShopifyInventorySyncService,
		ShopifyProductScheduler,
		ShopifyCustomerScheduler,
		ShopifyOrderScheduler,
		ShopifyAnalyticsScheduler,
		ShopifyInventoryScheduler,
	],
	controllers: [ShopifyController],
})
export class ShopifyModule {}
