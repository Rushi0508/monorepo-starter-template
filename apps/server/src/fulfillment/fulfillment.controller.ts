import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientTimezone } from 'src/common/decorators/timezone.decorator';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { FulfillmentQueryDto } from './dto/fulfillment-query.dto';
import { FulfillmentService } from './fulfillment.service';

@ApiTags('Fulfillment')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('fulfillment')
export class FulfillmentController {
	constructor(private readonly fulfillmentService: FulfillmentService) {}

	@Get()
	@ApiOperation({ summary: 'Get fulfillment kanban with metrics' })
	getFulfillment(
		@Query() query: FulfillmentQueryDto,
		@ClientTimezone() timeZone: string
	) {
		return this.fulfillmentService.getFulfillment(query, timeZone);
	}
}
