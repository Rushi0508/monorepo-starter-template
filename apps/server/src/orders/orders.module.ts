import { Module } from '@nestjs/common';
import { SkuModule } from 'src/sku/sku.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
	imports: [SkuModule],
	controllers: [OrdersController],
	providers: [OrdersService],
	exports: [OrdersService],
})
export class OrdersModule {}
