import { Module } from '@nestjs/common';
import { ShopifyModule } from 'src/shopify/shopify.module';
import { SkuModule } from 'src/sku/sku.module';
import { CustomerController } from './customer.controller';
import {
	CustomerProvisioningService,
	CustomersService,
	SampleOrderService,
} from './services';

@Module({
	imports: [ShopifyModule, SkuModule],
	controllers: [CustomerController],
	providers: [
		CustomersService,
		SampleOrderService,
		CustomerProvisioningService,
	],
	exports: [CustomersService, CustomerProvisioningService],
})
export class CustomerModule {}
