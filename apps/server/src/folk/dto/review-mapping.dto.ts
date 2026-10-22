import { FolkCustomerSearchInput, FolkLinkCustomerInput } from '@repo/types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FolkLinkCustomerDto implements FolkLinkCustomerInput {
	@IsString()
	@IsNotEmpty()
	customerId: string;
}

export class FolkCustomerSearchDto implements FolkCustomerSearchInput {
	@IsString()
	@IsOptional()
	search?: string;

	@IsString()
	@IsOptional()
	excludeMappingId?: string;
}
