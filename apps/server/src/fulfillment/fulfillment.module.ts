import { Module } from '@nestjs/common';
import { SkuModule } from 'src/sku/sku.module';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';

@Module({
	imports: [SkuModule],
	controllers: [FulfillmentController],
	providers: [FulfillmentService],
})
export class FulfillmentModule {}
