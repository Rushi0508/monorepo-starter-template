import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelEnum, DemandOverrideReasonEnum } from '@repo/enums';
import type { SetDemandEntryInput } from '@repo/types';
import {
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	MaxLength,
	Min,
	ValidateIf,
} from 'class-validator';

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

export class SetDemandEntryDto implements SetDemandEntryInput {
	@ApiProperty({ enum: ChannelEnum })
	@IsEnum(ChannelEnum)
	channel: ChannelEnum;

	@ApiProperty()
	@IsUUID('4')
	skuSettingId: string;

	@ApiProperty({ description: '"YYYY-MM"' })
	@Matches(PERIOD, { message: 'period must be a month in YYYY-MM format' })
	period: string;

	@ApiProperty({
		nullable: true,
		description: 'Null clears the override and restores the forecast',
	})
	@ValidateIf((_, value) => value !== null)
	@IsInt()
	@Min(0)
	units: number | null;

	@ApiPropertyOptional({ enum: DemandOverrideReasonEnum })
	@IsOptional()
	@IsEnum(DemandOverrideReasonEnum)
	reason?: DemandOverrideReasonEnum;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MaxLength(500)
	note?: string;
}
