import { ChannelEnum } from '@repo/enums';
import { OrderFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class OrderQueryDto implements OrderFilterType {
	@IsString()
	@IsOptional()
	search?: string;

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	paymentStatus?: string[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	fulfillmentStatus?: string[];

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	skus?: string[];

	@IsArray()
	@IsEnum(ChannelEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	channels?: ChannelEnum[];

	@IsString()
	@IsOptional()
	orderDateStart?: string;

	@IsString()
	@IsOptional()
	orderDateEnd?: string;

	@IsString()
	@IsOptional()
	estimatedDeliveryStart?: string;

	@IsString()
	@IsOptional()
	estimatedDeliveryEnd?: string;

	@IsString()
	@IsOptional()
	deliveredAtStart?: string;

	@IsString()
	@IsOptional()
	deliveredAtEnd?: string;

	@IsBoolean()
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true') return true;
		if (value === 'false') return false;
		return value;
	})
	isCancelled?: boolean;

	@IsString()
	@IsOptional()
	orderType?: 'normal' | 'bundle' | 'subscription';

	@IsString()
	@IsOptional()
	sortBy?: OrderFilterType['sortBy'];

	@IsString()
	@IsOptional()
	sortOrder?: OrderFilterType['sortOrder'];

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	@Transform(({ value }) => Math.min(value, 100))
	limit?: number = 20;
}
