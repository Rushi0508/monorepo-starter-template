import type { SkuOptionsFilterType } from '@repo/types';
import { IsIn, IsOptional } from 'class-validator';

export class SkuOptionsQueryDto implements SkuOptionsFilterType {
	@IsIn(['active'])
	@IsOptional()
	status?: 'active';

	@IsIn(['shopify', 'bluebox'])
	@IsOptional()
	connectedTo?: 'shopify' | 'bluebox';
}
