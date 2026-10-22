import type { UserFilterType } from '@repo/types';
import { IsOptional, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class UserFilterQueryDto
	extends PaginationDto
	implements UserFilterType
{
	@Trim()
	@IsString()
	@IsOptional()
	search?: string;
}
