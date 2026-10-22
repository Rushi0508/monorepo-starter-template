import { ChannelEnum } from '@repo/enums';
import type { RevenueFilterType, RevenueGroupBy } from '@repo/types';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

const GROUP_BY_VALUES: RevenueGroupBy[] = ['channel', 'sku'];

export class RevenueQueryDto implements RevenueFilterType {
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

	@IsIn(GROUP_BY_VALUES)
	@IsOptional()
	chartBy?: RevenueGroupBy;

	@IsIn(GROUP_BY_VALUES)
	@IsOptional()
	breakdownBy?: RevenueGroupBy;
}
