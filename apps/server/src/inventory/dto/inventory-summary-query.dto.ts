import type { InventoryGroupBy, InventorySummaryFilterType } from '@repo/types';
import { IsIn, IsOptional } from 'class-validator';

const GROUP_BY_VALUES: InventoryGroupBy[] = ['sku', 'location'];

export class InventorySummaryQueryDto implements InventorySummaryFilterType {
	@IsIn(GROUP_BY_VALUES)
	@IsOptional()
	breakdownBy?: InventoryGroupBy;
}
