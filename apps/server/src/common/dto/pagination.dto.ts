import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@IsOptional()
	page?: number = 1;

	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Transform(({ value }) => Math.min(value, 50))
	@IsOptional()
	limit?: number = 10;
}
