import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';

@Controller()
@ApiTags('Health Check')
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	@ApiOperation({
		summary: 'Health check',
	})
	@AllowAnonymous()
	healthCheck(): string {
		return this.appService.healthCheck();
	}
}
