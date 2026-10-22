import {
	Body,
	Controller,
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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateSampleOrdersDto } from './dto/create-sample-order.dto';
import { CustomerFilterQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
	CustomerProvisioningService,
	CustomersService,
	SampleOrderService,
} from './services';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class CustomerController {
	constructor(
		private readonly customersService: CustomersService,
		private readonly sampleOrderService: SampleOrderService,
		private readonly customerProvisioning: CustomerProvisioningService
	) {}

	@Get()
	@ApiOperation({ summary: 'Get customers' })
	async getCustomers(
		@Query() filter: CustomerFilterQueryDto,
		@ClientTimezone() timeZone: string
	) {
		return this.customersService.getCustomers(filter, timeZone);
	}

	@Post()
	@ApiOperation({ summary: 'Create a customer in Shopify and sync it back' })
	async createCustomer(@Body() dto: CreateCustomerDto) {
		return this.customerProvisioning.createCustomer(dto);
	}

	@Post('sample-orders')
	@ApiOperation({
		summary: 'Create free sample orders in Shopify, one per customer',
	})
	async createSampleOrders(@Body() dto: CreateSampleOrdersDto) {
		return this.sampleOrderService.createSampleOrders(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get customer detail' })
	async getCustomerDetail(
		@Param('id') id: string,
		@ClientTimezone() timeZone: string
	) {
		return this.customersService.getCustomerDetail(id, timeZone);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update customer' })
	async updateCustomer(
		@Param('id') id: string,
		@Body() dto: UpdateCustomerDto
	) {
		return this.customersService.updateCustomer(id, dto);
	}
}
