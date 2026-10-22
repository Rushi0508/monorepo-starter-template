import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelEnum, ForecastMethodTypeEnum } from '@repo/enums';
import type { SetForecastMethodInput } from '@repo/types';
import {
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class SetForecastMethodDto implements SetForecastMethodInput {
	@ApiProperty({ enum: ChannelEnum })
	@IsEnum(ChannelEnum)
	channel: ChannelEnum;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	skuSettingId: string;

	@ApiProperty({ enum: ForecastMethodTypeEnum })
	@IsEnum(ForecastMethodTypeEnum)
	method: ForecastMethodTypeEnum;

	@ApiPropertyOptional({ description: 'STATIC_GROWTH — rate as a ratio' })
	@IsOptional()
	@IsNumber()
	@Min(-1)
	@Max(10)
	growthPct?: number | null;

	@ApiPropertyOptional({ description: 'HISTORICAL_AVERAGE — trailing months' })
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(60)
	windowMonths?: number | null;
}
