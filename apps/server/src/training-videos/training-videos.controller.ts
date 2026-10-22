import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import {
	CreateTrainingVideoDto,
	UpdateTrainingVideoDto,
} from './dto/create-training-video.dto';
import { TrainingVideosService } from './training-videos.service';

@ApiTags('Training Videos')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('training-videos')
export class TrainingVideosController {
	constructor(private readonly trainingVideosService: TrainingVideosService) {}

	@Get()
	@ApiOperation({ summary: 'List training videos, newest first' })
	list() {
		return this.trainingVideosService.list();
	}

	@Post()
	@ApiOperation({ summary: 'Add a training video' })
	create(@Body() dto: CreateTrainingVideoDto, @Session() session: UserSession) {
		return this.trainingVideosService.create(dto, session.user.id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a training video' })
	update(@Param('id') id: string, @Body() dto: UpdateTrainingVideoDto) {
		return this.trainingVideosService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a training video' })
	delete(@Param('id') id: string) {
		return this.trainingVideosService.delete(id);
	}
}
