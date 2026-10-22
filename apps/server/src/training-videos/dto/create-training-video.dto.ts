import { PartialType } from '@nestjs/swagger';
import { CreateTrainingVideoInput } from '@repo/types';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
} from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateTrainingVideoDto implements CreateTrainingVideoInput {
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	title: string;

	@Trim()
	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string;

	@Trim()
	@IsUrl({ protocols: ['https'], require_protocol: true })
	@IsNotEmpty()
	url: string;
}

export class UpdateTrainingVideoDto extends PartialType(
	CreateTrainingVideoDto
) {}
