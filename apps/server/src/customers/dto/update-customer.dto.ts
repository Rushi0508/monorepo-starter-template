import type { UpdateCustomerInput } from '@repo/types';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCustomerDto implements UpdateCustomerInput {
	@IsInt()
	@Min(1)
	@Type(() => Number)
	storeCount: number;
}
