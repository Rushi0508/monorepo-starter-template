import { ChannelEnum } from '@repo/enums';
import { CustomerFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';

export class CustomerFilterQueryDto implements CustomerFilterType {
	@IsString()
	@IsOptional()
	search?: string;

	@IsString()
	@IsOptional()
	orderDateStart?: string;

	@IsString()
	@IsOptional()
	orderDateEnd?: string;

	@IsInt()
	@Min(0)
	@IsOptional()
	@Type(() => Number)
	minOrderCount?: number;

	@IsInt()
	@Min(0)
	@IsOptional()
	@Type(() => Number)
	maxOrderCount?: number;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	states?: string[];

	@IsArray()
	@IsEnum(ChannelEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	channels?: ChannelEnum[];

	@IsString()
	@IsOptional()
	sortBy?: CustomerFilterType['sortBy'];

	@IsString()
	@IsOptional()
	sortOrder?: CustomerFilterType['sortOrder'];

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	@Transform(({ value }) => Math.min(value, 100))
	limit?: number = 10;
}
