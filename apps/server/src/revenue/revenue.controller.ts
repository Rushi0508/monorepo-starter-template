import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientTimezone } from 'src/common/decorators/timezone.decorator';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { RevenueService } from './revenue.service';

@ApiTags('Revenue')
@Controller('revenue')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class RevenueController {
	constructor(private readonly revenueService: RevenueService) {}

	@Get()
	@ApiOperation({
		summary: 'Get revenue metrics, daily chart and SKU breakdown',
	})
	getRevenue(
		@Query() query: RevenueQueryDto,
		@ClientTimezone() timeZone: string
	) {
		return this.revenueService.getRevenue(query, timeZone);
	}
}
