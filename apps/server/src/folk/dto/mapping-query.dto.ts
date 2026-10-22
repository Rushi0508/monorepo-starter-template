import { FolkMappingStatusEnum } from '@repo/enums';
import { FolkMappingFilterType } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class FolkMappingQueryDto implements FolkMappingFilterType {
	@IsString()
	@IsOptional()
	search?: string;

	@IsEnum(FolkMappingStatusEnum)
	@IsOptional()
	status?: FolkMappingStatusEnum;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Type(() => Number)
	@Transform(({ value }) => Math.min(value, 100))
	limit?: number = 25;
}
