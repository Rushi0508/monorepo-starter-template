import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientTimezone } from 'src/common/decorators/timezone.decorator';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	@ApiOperation({
		summary: 'Get home dashboard metrics and order status breakdown',
	})
	getDashboard(
		@Query() query: DashboardQueryDto,
		@ClientTimezone() timeZone: string
	) {
		return this.dashboardService.getDashboard(query, timeZone);
	}
}
