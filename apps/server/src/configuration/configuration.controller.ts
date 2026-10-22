import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { ConfigurationService } from './configuration.service';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@ApiTags('Configuration')
@Controller('configuration')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class ConfigurationController {
	constructor(private readonly configurationService: ConfigurationService) {}

	@Get()
	@ApiOperation({ summary: 'Get system configuration' })
	getConfiguration() {
		return this.configurationService.getConfiguration();
	}

	@Put()
	@ApiOperation({ summary: 'Update system configuration' })
	updateConfiguration(@Body() dto: UpdateConfigurationDto) {
		return this.configurationService.updateConfiguration(dto);
	}
}
