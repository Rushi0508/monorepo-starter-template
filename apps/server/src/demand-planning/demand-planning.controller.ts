import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiConsumes,
	ApiCookieAuth,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import {
	CreateSkuChannelFulfillmentCostDto,
	CreateSkuChannelPriceDto,
	CreateSkuCogsDto,
} from 'src/sku/dto/create-sku-pricing.dto';
import { DemandAccuracyQueryDto } from './dto/demand-accuracy-query.dto';
import { SetDemandEntryDto } from './dto/demand-entry.dto';
import {
	ComparePlansDto,
	CreateDemandPlanDto,
	FinalizeDemandPlanDto,
	UpdateDemandPlanDto,
} from './dto/demand-plan.dto';
import { CreateDemandScenarioDto } from './dto/demand-scenario.dto';
import { SetForecastMethodDto } from './dto/forecast-method.dto';
import { DemandComparisonService } from './services/demand-compare.service';
import { DemandEntryService } from './services/demand-entry.service';
import { DemandForecastMethodService } from './services/demand-forecast-method.service';
import { DemandGridService } from './services/demand-grid.service';
import { DemandImportService } from './services/demand-import.service';
import { DemandPlanService } from './services/demand-plan.service';
import { DemandPlanPricingService } from './services/demand-plan-pricing.service';
import { DemandScenarioService } from './services/demand-scenario.service';
import { ForecastAccuracyService } from './services/forecast-accuracy.service';

@ApiTags('Demand Planning')
@Controller('demand-plans')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class DemandPlanningController {
	constructor(
		private readonly plans: DemandPlanService,
		private readonly methods: DemandForecastMethodService,
		private readonly pricing: DemandPlanPricingService,
		private readonly grid: DemandGridService,
		private readonly entries: DemandEntryService,
		private readonly comparison: DemandComparisonService,
		private readonly accuracy: ForecastAccuracyService,
		private readonly scenarios: DemandScenarioService,
		private readonly imports: DemandImportService
	) {}

	@Get('operative')
	@ApiOperation({
		summary:
			'The plan the workspace shows: the open draft, else the latest finalized plan',
	})
	getOperative() {
		return this.plans.getOperativePlan();
	}

	@Get()
	@ApiOperation({ summary: 'Every plan, newest first, with its totals' })
	list() {
		return this.plans.listPlans();
	}

	@Post()
	@ApiOperation({ summary: 'Create a plan. Only one draft may be open.' })
	create(@Body() dto: CreateDemandPlanDto, @Session() session: UserSession) {
		return this.plans.create(dto, session);
	}

	@Get('compare')
	@ApiOperation({
		summary: 'Diff two plans over the months they both forecast',
	})
	compare(@Query() query: ComparePlansDto) {
		return this.comparison.compare(query.planAId, query.planBId);
	}

	@Get('accuracy')
	@ApiOperation({
		summary: 'Finalized plans scored against what actually shipped',
	})
	getAccuracy(@Query() query: DemandAccuracyQueryDto) {
		return this.accuracy.getAccuracy(query);
	}

	@Get('scenarios')
	@ApiOperation({ summary: 'Every scenario, newest first' })
	listScenarios(@Query('basePlanId') basePlanId?: string) {
		return this.scenarios.list(basePlanId);
	}

	@Post('scenarios')
	@ApiOperation({ summary: 'Fork a plan into a new scenario' })
	createScenario(
		@Body() dto: CreateDemandScenarioDto,
		@Session() session: UserSession
	) {
		return this.scenarios.create(dto, session);
	}

	@Post('scenarios/:id/duplicate')
	@ApiOperation({ summary: 'Copy a scenario, including its edits' })
	duplicateScenario(@Param('id') id: string, @Session() session: UserSession) {
		return this.scenarios.duplicate(id, session);
	}

	@Post('scenarios/:id/save')
	@ApiOperation({ summary: 'Lock a scenario at its current numbers' })
	saveScenario(@Param('id') id: string, @Session() session: UserSession) {
		return this.scenarios.save(id, session);
	}

	@Post('scenarios/:id/reopen')
	@ApiOperation({ summary: 'Unlock a saved scenario for editing' })
	reopenScenario(@Param('id') id: string, @Session() session: UserSession) {
		return this.scenarios.reopen(id, session);
	}

	@Post('scenarios/:id/promote')
	@ApiOperation({ summary: 'Turn a scenario into the open base plan' })
	promoteScenario(@Param('id') id: string, @Session() session: UserSession) {
		return this.scenarios.promote(id, session);
	}

	@Delete('scenarios/:id')
	@ApiOperation({ summary: 'Delete a scenario and everything scoped to it' })
	removeScenario(@Param('id') id: string) {
		return this.scenarios.remove(id);
	}
	@Get(':id')
	@ApiOperation({ summary: 'One plan, with the channels and SKUs it covers' })
	getPlan(@Param('id') id: string) {
		return this.plans.getPlan(id);
	}

	@Get(':id/audits')
	@ApiOperation({ summary: "A plan's activity, newest first" })
	getAudits(@Param('id') id: string) {
		return this.plans.getAudits(id);
	}

	@Get(':id/grid')
	@ApiOperation({ summary: 'The planning grid: every column and every cell' })
	getGrid(@Param('id') id: string) {
		return this.grid.getPlanGrid(id);
	}

	@Put(':id/entries')
	@ApiOperation({
		summary: 'Type into one cell, or clear it back to the forecast',
	})
	setEntry(
		@Param('id') id: string,
		@Body() dto: SetDemandEntryDto,
		@Session() session: UserSession
	) {
		return this.entries.set(id, dto, session);
	}

	@Get(':id/forecast-methods')
	@ApiOperation({
		summary: 'Every series in scope with the method in force',
	})
	listForecastMethods(@Param('id') id: string) {
		return this.methods.list(id);
	}

	@Put(':id/forecast-methods')
	@ApiOperation({ summary: 'Set the method for one channel x SKU series' })
	setForecastMethod(
		@Param('id') id: string,
		@Body() dto: SetForecastMethodDto,
		@Session() session: UserSession
	) {
		return this.methods.set(id, dto, session);
	}

	@Get(':id/pricing')
	@ApiOperation({
		summary: "The plan's own cost and price history, newest first",
	})
	getPricing(@Param('id') id: string) {
		return this.pricing.getPricing(id);
	}

	@Post(':id/pricing/:skuSettingId/cogs')
	@ApiOperation({ summary: 'Add a cost version for a SKU in this plan' })
	addCogs(
		@Param('id') id: string,
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuCogsDto,
		@Session() session: UserSession
	) {
		return this.pricing.addCogs(id, skuSettingId, dto, session);
	}

	@Post(':id/pricing/:skuSettingId/channel-fulfillment-cost')
	@ApiOperation({ summary: 'Add a fulfillment cost version for a SKU' })
	addChannelFulfillmentCost(
		@Param('id') id: string,
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuChannelFulfillmentCostDto,
		@Session() session: UserSession
	) {
		return this.pricing.addChannelFulfillmentCost(
			id,
			skuSettingId,
			dto,
			session
		);
	}

	@Post(':id/pricing/:skuSettingId/channel-price')
	@ApiOperation({ summary: 'Add a price version for a SKU in a channel' })
	addChannelPrice(
		@Param('id') id: string,
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuChannelPriceDto,
		@Session() session: UserSession
	) {
		return this.pricing.addChannelPrice(id, skuSettingId, dto, session);
	}

	@Delete(':id/pricing/cogs/:versionId')
	@ApiOperation({ summary: 'Remove a cost version' })
	removeCogs(
		@Param('id') id: string,
		@Param('versionId') versionId: string,
		@Session() session: UserSession
	) {
		return this.pricing.removeCogs(id, versionId, session);
	}

	@Delete(':id/pricing/channel-fulfillment-cost/:versionId')
	@ApiOperation({ summary: 'Remove a fulfillment cost version' })
	removeChannelFulfillmentCost(
		@Param('id') id: string,
		@Param('versionId') versionId: string,
		@Session() session: UserSession
	) {
		return this.pricing.removeChannelFulfillmentCost(id, versionId, session);
	}

	@Delete(':id/pricing/channel-price/:versionId')
	@ApiOperation({ summary: 'Remove a price version' })
	removeChannelPrice(
		@Param('id') id: string,
		@Param('versionId') versionId: string,
		@Session() session: UserSession
	) {
		return this.pricing.removeChannelPrice(id, versionId, session);
	}

	@Post(':id/finalize')
	@ApiOperation({
		summary: 'Lock a plan for good and freeze the actuals it was built on',
	})
	finalize(
		@Param('id') id: string,
		@Body() dto: FinalizeDemandPlanDto,
		@Session() session: UserSession
	) {
		return this.plans.finalize(id, dto, session);
	}

	@Post(':id/import')
	@ApiOperation({
		summary: 'Set plan numbers in bulk from a CSV or Excel file',
	})
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(
		FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })
	)
	importPlan(
		@Param('id') id: string,
		@UploadedFile()
		file: { buffer: Buffer; originalname?: string } | undefined,
		@Session() session: UserSession
	) {
		if (!file) throw new BadRequestException('No file uploaded');
		return this.imports.import(id, file, session);
	}

	@Post(':id/unlock')
	@ApiOperation({ summary: 'Return a finalized plan to draft' })
	unlock(@Param('id') id: string, @Session() session: UserSession) {
		return this.plans.unlock(id, session);
	}

	@Post(':id/roll-forward')
	@ApiOperation({ summary: 'Start the next cycle from this plan' })
	rollForward(@Param('id') id: string, @Session() session: UserSession) {
		return this.plans.rollForward(id, session);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Edit a draft plan from the configuration panel' })
	update(
		@Param('id') id: string,
		@Body() dto: UpdateDemandPlanDto,
		@Session() session: UserSession
	) {
		return this.plans.update(id, dto, session);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a plan and everything scoped to it' })
	remove(@Param('id') id: string) {
		return this.plans.remove(id);
	}
}
