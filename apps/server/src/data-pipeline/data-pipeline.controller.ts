import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { DataPipelineName } from '@repo/constants';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import {
	SetPipelinePausedDto,
	TriggerPipelineDto,
} from './dto/pipeline-actions.dto';
import { DataPipelineService } from './services/data-pipeline.service';
import { DataPipelineRunnerService } from './services/data-pipeline-runner.service';

@ApiTags('Data Pipelines')
@Controller('data-pipelines')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class DataPipelineController {
	constructor(
		private readonly pipelineService: DataPipelineService,
		private readonly runnerService: DataPipelineRunnerService
	) {}

	@Get()
	@ApiOperation({ summary: 'List all data pipelines with their sync status' })
	async findAll() {
		return this.pipelineService.findAll();
	}

	@Post(':name/trigger')
	@ApiOperation({
		summary:
			'Manually trigger a pipeline run; force clears a stuck RUNNING lock',
	})
	async trigger(@Param('name') name: string, @Body() dto: TriggerPipelineDto) {
		await this.runnerService.run(name as DataPipelineName, {
			force: dto.force,
		});
		return { message: `Pipeline "${name}" triggered successfully` };
	}

	@Patch(':name/paused')
	@ApiOperation({ summary: 'Pause or resume a pipeline' })
	async setPaused(
		@Param('name') name: string,
		@Body() dto: SetPipelinePausedDto
	) {
		await this.pipelineService.setPaused(
			name as DataPipelineName,
			dto.isPaused
		);
		return {
			message: `Pipeline "${name}" ${dto.isPaused ? 'paused' : 'resumed'}`,
		};
	}
}
