import { ChannelEnum } from '@repo/enums';
import { DemandAccuracyFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	Matches,
	Min,
} from 'class-validator';

const toArray = ({ value }: { value: unknown }): unknown =>
	typeof value === 'string' ? value.split(',').filter(Boolean) : value;

export class DemandAccuracyQueryDto implements DemandAccuracyFilterType {
	@IsOptional()
	@Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
		message: 'Expected a month in YYYY-MM format',
	})
	demandPeriod?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	lag?: number;

	@IsOptional()
	@Transform(toArray)
	@IsArray()
	@IsEnum(ChannelEnum, { each: true })
	channels?: ChannelEnum[];

	@IsOptional()
	@Transform(toArray)
	@IsArray()
	@IsString({ each: true })
	skuSettingIds?: string[];
}
