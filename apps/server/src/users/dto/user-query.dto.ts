import { UserFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UserFilterQueryDto implements UserFilterType {
	@IsString()
	@IsOptional()
	search?: string;

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
