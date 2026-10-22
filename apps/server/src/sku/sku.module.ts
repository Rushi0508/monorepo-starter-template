import { Module } from '@nestjs/common';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';
import { SkuAuditLogService } from './sku-audit-log.service';
import { SkuCostService } from './sku-cost.service';
import { SkuPricingService } from './sku-pricing.service';

@Module({
	controllers: [SkuController],
	providers: [
		SkuService,
		SkuAuditLogService,
		SkuPricingService,
		SkuCostService,
	],
	exports: [SkuService, SkuPricingService, SkuCostService],
})
export class SkuModule {}
