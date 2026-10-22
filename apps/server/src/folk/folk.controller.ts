import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { FolkMappingQueryDto } from './dto/mapping-query.dto';
import {
	FolkCustomerSearchDto,
	FolkLinkCustomerDto,
} from './dto/review-mapping.dto';
import { SetFolkTrackedGroupsDto } from './dto/set-groups.dto';
import { FolkGroupsService } from './services/folk-groups.service';
import { FolkMappingService } from './services/folk-mapping.service';
import { FolkPreflightService } from './services/folk-preflight.service';
import { FolkSeedService } from './services/folk-seed.service';

@ApiTags('Folk')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('folk')
export class FolkController {
	constructor(
		private readonly mappingService: FolkMappingService,
		private readonly seedService: FolkSeedService,
		private readonly preflightService: FolkPreflightService,
		private readonly groupsService: FolkGroupsService
	) {}

	@Get('groups')
	@ApiOperation({
		summary: 'Folk workspace groups, flagged with the ones Sauero tracks',
	})
	listGroups() {
		return this.groupsService.list();
	}

	@Put('groups')
	@ApiOperation({
		summary: 'Replace the tracked Folk groups; untracked groups lose mappings',
	})
	setTrackedGroups(@Body() dto: SetFolkTrackedGroupsDto) {
		return this.groupsService.setTracked(dto.folkGroupIds);
	}

	@Get('mappings/summary')
	@ApiOperation({ summary: 'Counts of Folk mappings by status' })
	summary() {
		return this.mappingService.summary();
	}

	@Get('mappings')
	@ApiOperation({ summary: 'List Folk company mappings for review' })
	listMappings(@Query() filter: FolkMappingQueryDto) {
		return this.mappingService.list(filter);
	}

	@Get('customers')
	@ApiOperation({ summary: 'Search Shopify customers for Folk mapping' })
	searchCustomers(@Query() query: FolkCustomerSearchDto) {
		return this.mappingService.searchCustomers(
			query.search ?? '',
			query.excludeMappingId
		);
	}

	@Post('mappings/:id/customers')
	@ApiOperation({
		summary: 'Link a Shopify customer to a Folk company mapping',
	})
	linkCustomer(@Param('id') id: string, @Body() dto: FolkLinkCustomerDto) {
		return this.mappingService.linkCustomer(id, dto.customerId);
	}

	@Delete('mappings/:id/customers/:customerId')
	@ApiOperation({
		summary: 'Unlink a Shopify customer from a Folk company mapping',
	})
	unlinkCustomer(
		@Param('id') id: string,
		@Param('customerId') customerId: string
	) {
		return this.mappingService.unlinkCustomer(id, customerId);
	}

	@Post('mappings/:id/deny')
	@ApiOperation({
		summary: 'Deny the proposed customer and leave the company unmapped',
	})
	denyProposal(@Param('id') id: string) {
		return this.mappingService.denyProposal(id);
	}

	@Post('mappings/:id/unmapped')
	@ApiOperation({ summary: 'Mark a Folk company as explicitly unmapped' })
	markUnmapped(@Param('id') id: string) {
		return this.mappingService.markUnmapped(id);
	}

	@Post('seed')
	@ApiOperation({
		summary: 'Seed Folk companies from tracked groups into the mapping table',
	})
	seed() {
		return this.seedService.seed();
	}

	@Post('fields/preflight')
	@ApiOperation({
		summary:
			'List Folk custom fields, report mismatches, create missing Sauero-owned fields',
	})
	preflight() {
		return this.preflightService.run();
	}
}
