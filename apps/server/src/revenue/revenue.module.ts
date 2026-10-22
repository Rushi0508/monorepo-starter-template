import { Module } from '@nestjs/common';
import { SkuModule } from 'src/sku/sku.module';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';

@Module({
	imports: [SkuModule],
	controllers: [RevenueController],
	providers: [RevenueService],
	exports: [RevenueService],
})
export class RevenueModule {}
