import { PartialType } from '@nestjs/swagger';
import { ChannelEnum } from '@repo/enums';
import type {
	CreateDemandPlanInput,
	DemandComparisonFilterType,
	DemandPlanChannelScopeInput,
	DemandPlanThresholdsInput,
	FinalizeDemandPlanInput,
} from '@repo/types';
import { Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	Max,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

/** "YYYY-MM" */
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

/** One channel and the SKUs it sells. */
export class DemandPlanChannelScopeDto implements DemandPlanChannelScopeInput {
	@IsEnum(ChannelEnum)
	channel: ChannelEnum;

	@IsArray()
	@ArrayMinSize(1)
	@IsUUID('4', { each: true })
	skuSettingIds: string[];
}

export class CreateDemandPlanDto implements CreateDemandPlanInput {
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

	@Matches(PERIOD, { message: 'horizonEnd must be a month in YYYY-MM format' })
	horizonEnd: string;

	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => DemandPlanChannelScopeDto)
	scope: DemandPlanChannelScopeDto[];
}

export class UpdateDemandPlanDto
	extends PartialType(CreateDemandPlanDto)
	implements Partial<DemandPlanThresholdsInput>
{
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	flagOverrideAbovePct?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(1)
	requireReasonAbovePct?: number;
}

export class FinalizeDemandPlanDto implements FinalizeDemandPlanInput {
	@Trim()
	@IsString()
	@IsOptional()
	@MaxLength(2000)
	notes?: string;
}

export class ComparePlansDto implements DemandComparisonFilterType {
	@IsString()
	@IsOptional()
	planAId: string;

	@IsString()
	@IsOptional()
	planBId: string;
}
