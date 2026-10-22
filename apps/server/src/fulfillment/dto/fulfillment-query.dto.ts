import { ChannelEnum } from '@repo/enums';
import type { FulfillmentFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class FulfillmentQueryDto implements FulfillmentFilterType {
	@IsString()
	@IsOptional()
	search?: string;

	@IsString()
	@IsOptional()
	orderDateStart?: string;

	@IsOptional()
	@IsString()
	orderDateEnd?: string;

	@IsArray()
	@IsEnum(ChannelEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	channels?: ChannelEnum[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	fulfillmentStatus?: string[];

	@IsString()
	@IsOptional()
	sortBy?: FulfillmentFilterType['sortBy'];

	@IsString()
	@IsOptional()
	sortOrder?: FulfillmentFilterType['sortOrder'];

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	limit?: number = 20;
}
