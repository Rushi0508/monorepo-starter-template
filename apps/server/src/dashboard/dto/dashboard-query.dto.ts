import { ChannelEnum } from '@repo/enums';
import { DashboardFilterType } from '@repo/types';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class DashboardQueryDto implements DashboardFilterType {
	@IsString()
	@IsOptional()
	dateStart?: string;

	@IsString()
	@IsOptional()
	dateEnd?: string;

	@IsArray()
	@IsEnum(ChannelEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.split(',') : value
	)
	channels?: ChannelEnum[];
}
