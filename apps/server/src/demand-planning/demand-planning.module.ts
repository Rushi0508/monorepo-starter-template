import { Module } from '@nestjs/common';
import { DemandPlanningController } from './demand-planning.controller';
import { DemandActualsScheduler } from './schedulers/demand-actuals.scheduler';
import { DemandActualsService } from './services/demand-actuals.service';
import { DemandComparisonService } from './services/demand-compare.service';
import { DemandEntryService } from './services/demand-entry.service';
import { DemandForecastMethodService } from './services/demand-forecast-method.service';
import { DemandGridService } from './services/demand-grid.service';
import { DemandImportService } from './services/demand-import.service';
import { DemandPlanService } from './services/demand-plan.service';
import { DemandPlanAuditService } from './services/demand-plan-audit.service';
import { DemandPlanPricingService } from './services/demand-plan-pricing.service';
import { DemandScenarioService } from './services/demand-scenario.service';
import { ForecastAccuracyService } from './services/forecast-accuracy.service';

@Module({
	controllers: [DemandPlanningController],
	providers: [
		DemandActualsService,
		DemandActualsScheduler,
		DemandComparisonService,
		DemandEntryService,
		DemandForecastMethodService,
		DemandGridService,
		DemandImportService,
		DemandPlanAuditService,
		DemandPlanPricingService,
		DemandPlanService,
		DemandScenarioService,
		ForecastAccuracyService,
	],
	exports: [
		DemandActualsService,
		DemandActualsScheduler,
		DemandForecastMethodService,
		DemandGridService,
		DemandPlanService,
	],
})
export class DemandPlanningModule {}
