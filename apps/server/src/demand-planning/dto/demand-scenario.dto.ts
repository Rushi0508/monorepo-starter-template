import type { CreateDemandScenarioInput } from '@repo/types';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateDemandScenarioDto implements CreateDemandScenarioInput {
	@IsString()
	@IsNotEmpty()
	basePlanId: string;

	@Trim()
	@IsString()
	@IsNotEmpty()
	@MaxLength(120)
	name: string;

	@Trim()
	@IsString()
	@IsOptional()
	@MaxLength(2000)
	notes?: string;
}
