import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientTimezone } from 'src/common/decorators/timezone.decorator';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@ApiOperation({ summary: 'Get paginated orders with filters' })
	getOrders(@Query() query: OrderQueryDto, @ClientTimezone() timeZone: string) {
		return this.ordersService.getOrders(query, timeZone);
	}
}
