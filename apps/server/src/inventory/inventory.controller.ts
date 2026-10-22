import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientTimezone } from 'src/common/decorators/timezone.decorator';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { BlueboxInventoryService } from './bluebox/bb-inventory.service';
import { CreateProductionRunDto } from './bluebox/dto/create-production-run.dto';
import { UpdateProductionRunDto } from './bluebox/dto/update-production-run.dto';
import { InventorySummaryQueryDto } from './dto/inventory-summary-query.dto';
import { CreateReplenishmentOrderDto } from './manuel-brothers/dto/create-replenishment-order.dto';
import { ManuelBrothersInventoryService } from './manuel-brothers/mb-inventory.service';
import { MbReplenishmentService } from './manuel-brothers/mb-replenishment.service';
import { InventorySummaryService } from './services/inventory-summary.service';

@ApiTags('Inventory')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('inventory')
export class InventoryController {
	constructor(
		private readonly bbInventoryService: BlueboxInventoryService,
		private readonly mbInventoryService: ManuelBrothersInventoryService,
		private readonly mbReplenishmentService: MbReplenishmentService,
		private readonly inventorySummaryService: InventorySummaryService
	) {}

	@Get('summary')
	@ApiOperation({
		summary: 'Get stock and COGS value across BlueBox and Manuel Brothers',
	})
	getInventorySummary(
		@Query() query: InventorySummaryQueryDto,
		@ClientTimezone() timeZone: string
	) {
		return this.inventorySummaryService.getSummary(query, timeZone);
	}

	@Get('bluebox')
	@ApiOperation({
		summary: 'Get Bluebox SKU-level inventory with lot breakdown',
	})
	getBlueboxInventory() {
		return this.bbInventoryService.getInventory();
	}

	@Get('bluebox/asns')
	@ApiOperation({
		summary: 'Get all Bluebox ASNs with full detail (packages included)',
	})
	getBlueboxAsns() {
		return this.bbInventoryService.getAsns();
	}

	@Get('bluebox/production-runs')
	@ApiOperation({ summary: 'Get all Bluebox production runs' })
	getBlueboxProductionRuns() {
		return this.bbInventoryService.getProductionRuns();
	}

	@Post('bluebox/production-runs')
	@ApiOperation({ summary: 'Create a new Bluebox production run' })
	createBlueboxProductionRun(@Body() dto: CreateProductionRunDto) {
		return this.bbInventoryService.createProductionRun(dto);
	}

	@Patch('bluebox/production-runs/:id')
	@ApiOperation({
		summary: 'Mark a Bluebox production run complete or reopen it',
	})
	updateBlueboxProductionRun(
		@Param('id') id: string,
		@Body() dto: UpdateProductionRunDto
	) {
		return this.bbInventoryService.setProductionRunCompleted(id, dto.completed);
	}

	@Delete('bluebox/production-runs/:id')
	@ApiOperation({ summary: 'Delete a Bluebox production run' })
	deleteBlueboxProductionRun(@Param('id') id: string) {
		return this.bbInventoryService.deleteProductionRun(id);
	}

	@Get('bluebox/kit-orders')
	@ApiOperation({
		summary: 'Get all Bluebox kitting orders with components and final items',
	})
	getBlueboxKitOrders() {
		return this.bbInventoryService.getKitOrders();
	}

	// ── Shopify (Manuel Brothers) ────────────────────────────────────────────────

	@Get('mb')
	@ApiOperation({
		summary: 'Get Manuel Brothers inventory',
	})
	getManuelBrothersInventory() {
		return this.mbInventoryService.getManuelBrothersInventory();
	}

	@Get('mb/replenishment-orders')
	@ApiOperation({ summary: 'List all MB replenishment orders' })
	getReplenishmentOrders() {
		return this.mbReplenishmentService.getOrders();
	}

	@Post('mb/replenishment-orders')
	@ApiOperation({
		summary: 'Create a new MB replenishment order (sends to BlueBox)',
	})
	createReplenishmentOrder(@Body() dto: CreateReplenishmentOrderDto) {
		return this.mbReplenishmentService.createOrder(dto);
	}
}
