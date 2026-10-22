import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import {
	CreateSkuColumnDto,
	UpdateSkuColumnDto,
} from './dto/create-sku-column.dto';
import {
	CreateSkuChannelFulfillmentCostDto,
	CreateSkuChannelPriceDto,
	CreateSkuCogsDto,
	CreateSkuMsrpDto,
} from './dto/create-sku-pricing.dto';
import {
	CreateSkuSettingDto,
	UpdateSkuSettingDto,
} from './dto/create-sku-setting.dto';
import { ReorderSkuColumnsDto } from './dto/reorder-sku-columns.dto';
import { SkuOptionsQueryDto } from './dto/sku-options-query.dto';
import { UpdateSkuSettingsDto } from './dto/update-sku-settings.dto';
import { SkuService } from './sku.service';
import { SkuAuditLogService } from './sku-audit-log.service';
import { SkuPricingService } from './sku-pricing.service';

@ApiTags('SKUs')
@Controller('skus')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class SkuController {
	constructor(
		private readonly skuService: SkuService,
		private readonly skuAuditLogService: SkuAuditLogService,
		private readonly skuPricingService: SkuPricingService
	) {}

	@Get('audit-logs')
	@ApiOperation({ summary: 'List SKU settings audit activity, newest first' })
	getAuditLogs() {
		return this.skuAuditLogService.getAuditLogs();
	}

	@Get('options')
	@ApiOperation({ summary: 'Get all distinct SKUs with product titles' })
	getSkuOptions(@Query() filter: SkuOptionsQueryDto) {
		return this.skuService.getSkuOptions(filter);
	}

	@Get('settings')
	@ApiOperation({ summary: 'Get SKU configuration settings with columns' })
	getSkuSettings() {
		return this.skuService.getSkuSettings();
	}

	@Get('settings/check')
	@ApiOperation({
		summary: 'Check SKU existence across Shopify, Bluebox, and SKU settings',
	})
	@ApiQuery({ name: 'sku', required: true, description: 'SKU to check' })
	@ApiQuery({
		name: 'excludeId',
		required: false,
		description:
			'SKU setting being edited; its own current and old codes count as unique',
	})
	checkSku(@Query('sku') sku: string, @Query('excludeId') excludeId?: string) {
		return this.skuService.checkSku(sku, excludeId);
	}

	@Post('settings')
	@ApiOperation({ summary: 'Manually add a new SKU to settings' })
	createSkuSetting(
		@Body() dto: CreateSkuSettingDto,
		@Session() session: UserSession
	) {
		return this.skuService.createSkuSetting(dto, session);
	}

	@Put('settings')
	@ApiOperation({ summary: 'Bulk update SKU custom field values' })
	updateSkuSettings(
		@Body() dto: UpdateSkuSettingsDto,
		@Session() session: UserSession
	) {
		return this.skuService.updateSkuSettings(dto, session);
	}

	@Patch('settings/:id')
	@ApiOperation({ summary: 'Update a SKU setting (title/sku)' })
	updateSkuSetting(
		@Param('id') id: string,
		@Body() dto: UpdateSkuSettingDto,
		@Session() session: UserSession
	) {
		return this.skuService.updateSkuSetting(id, dto, session);
	}

	@Delete('settings/:id')
	@ApiOperation({ summary: 'Delete a SKU setting' })
	deleteSkuSetting(@Param('id') id: string, @Session() session: UserSession) {
		return this.skuService.deleteSkuSetting(id, session);
	}

	@Post('columns')
	@ApiOperation({ summary: 'Create a dynamic SKU settings column' })
	createColumn(
		@Body() dto: CreateSkuColumnDto,
		@Session() session: UserSession
	) {
		return this.skuService.createColumn(dto, session);
	}

	@Put('columns/reorder')
	@ApiOperation({ summary: 'Reorder dynamic SKU settings columns' })
	reorderColumns(
		@Body() dto: ReorderSkuColumnsDto,
		@Session() session: UserSession
	) {
		return this.skuService.reorderColumns(dto, session);
	}

	@Patch('columns/:id')
	@ApiOperation({ summary: 'Rename a dynamic SKU settings column' })
	updateColumn(
		@Param('id') id: string,
		@Body() dto: UpdateSkuColumnDto,
		@Session() session: UserSession
	) {
		return this.skuService.updateColumn(id, dto, session);
	}

	@Delete('columns/:id')
	@ApiOperation({
		summary: 'Delete a dynamic column and remove its values from all SKUs',
	})
	deleteColumn(@Param('id') id: string, @Session() session: UserSession) {
		return this.skuService.deleteColumn(id, session);
	}

	// ── Pricing ───────────────────────────────────────────────────────────────

	@Get('pricing/:skuSettingId')
	@ApiOperation({
		summary:
			'COGS, channel fulfillment cost, MSRP and channel price history for a SKU, newest first',
	})
	getPricing(@Param('skuSettingId') skuSettingId: string) {
		return this.skuPricingService.getPricing(skuSettingId);
	}

	@Post('pricing/:skuSettingId/cogs')
	@ApiOperation({
		summary: 'Add a COGS version for a SKU (materials + production + shipping)',
	})
	addCogs(
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuCogsDto,
		@Session() session: UserSession
	) {
		return this.skuPricingService.addCogs(skuSettingId, dto, session);
	}

	@Post('pricing/:skuSettingId/channel-fulfillment-cost')
	@ApiOperation({
		summary:
			'Add a channel fulfillment cost version for a SKU (storage + pick + pack + shipping)',
	})
	addChannelFulfillmentCost(
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuChannelFulfillmentCostDto,
		@Session() session: UserSession
	) {
		return this.skuPricingService.addChannelFulfillmentCost(
			skuSettingId,
			dto,
			session
		);
	}

	@Post('pricing/:skuSettingId/channel-price')
	@ApiOperation({ summary: 'Add a channel price version for a SKU' })
	addChannelPrice(
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuChannelPriceDto,
		@Session() session: UserSession
	) {
		return this.skuPricingService.addChannelPrice(skuSettingId, dto, session);
	}

	@Post('pricing/:skuSettingId/msrp')
	@ApiOperation({ summary: 'Add an MSRP version for a SKU' })
	addMsrp(
		@Param('skuSettingId') skuSettingId: string,
		@Body() dto: CreateSkuMsrpDto,
		@Session() session: UserSession
	) {
		return this.skuPricingService.addMsrp(skuSettingId, dto, session);
	}

	@Delete('pricing/cogs/:id')
	@ApiOperation({ summary: 'Remove a COGS version' })
	deleteCogs(@Param('id') id: string, @Session() session: UserSession) {
		return this.skuPricingService.deleteCogs(id, session);
	}

	@Delete('pricing/channel-fulfillment-cost/:id')
	@ApiOperation({ summary: 'Remove a channel fulfillment cost version' })
	deleteChannelFulfillmentCost(
		@Param('id') id: string,
		@Session() session: UserSession
	) {
		return this.skuPricingService.deleteChannelFulfillmentCost(id, session);
	}

	@Delete('pricing/channel-price/:id')
	@ApiOperation({ summary: 'Remove a channel price version' })
	deleteChannelPrice(@Param('id') id: string, @Session() session: UserSession) {
		return this.skuPricingService.deleteChannelPrice(id, session);
	}

	@Delete('pricing/msrp/:id')
	@ApiOperation({ summary: 'Remove an MSRP version' })
	deleteMsrp(@Param('id') id: string, @Session() session: UserSession) {
		return this.skuPricingService.deleteMsrp(id, session);
	}
}
