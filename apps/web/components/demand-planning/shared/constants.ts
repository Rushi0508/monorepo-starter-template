import {
	DemandOverrideReasonEnum,
	DemandPlanKindEnum,
	DemandPlanStatusEnum,
	ForecastMethodTypeEnum,
} from '@repo/enums';

/** Display labels for the plan enums — presentation, so kept out of @repo/enums. */

export const DEMAND_PLAN_KIND_LABELS: Record<DemandPlanKindEnum, string> = {
	[DemandPlanKindEnum.BASE]: 'Base plan',
	[DemandPlanKindEnum.SCENARIO]: 'Scenario',
};

export const DEMAND_PLAN_STATUS_LABELS: Record<DemandPlanStatusEnum, string> = {
	[DemandPlanStatusEnum.DRAFT]: 'Draft',
	[DemandPlanStatusEnum.SAVED]: 'Saved',
	[DemandPlanStatusEnum.FINAL]: 'Finalized',
};

export const DEMAND_PLAN_STATUS_VARIANTS: Record<
	DemandPlanStatusEnum,
	'secondary' | 'default' | 'outline'
> = {
	[DemandPlanStatusEnum.DRAFT]: 'secondary',
	[DemandPlanStatusEnum.SAVED]: 'default',
	[DemandPlanStatusEnum.FINAL]: 'outline',
};

export const FORECAST_METHOD_LABELS: Record<ForecastMethodTypeEnum, string> = {
	[ForecastMethodTypeEnum.STATIC_GROWTH]: 'Static growth',
	[ForecastMethodTypeEnum.HISTORICAL_AVERAGE]: 'Historical average',
	[ForecastMethodTypeEnum.HARD_ENTRY]: 'Hard entry',
};

/** "Sauero 12oz Case, Salted Lime - SAU-SL-12-12CASE" — title first, code after. */
export const skuLabel = (sku?: { sku: string; title?: string }): string => {
	if (!sku) return 'This SKU';
	const title = sku.title?.trim();
	return title && title !== sku.sku ? `${title} - ${sku.sku}` : sku.sku;
};

export const OVERRIDE_REASON_LABELS: Record<DemandOverrideReasonEnum, string> =
	{
		[DemandOverrideReasonEnum.PROMOTION]: 'Promotion',
		[DemandOverrideReasonEnum.CUSTOMER_COMMITMENT]: 'Customer commitment',
		[DemandOverrideReasonEnum.SALES_INPUT]: 'Sales input',
		[DemandOverrideReasonEnum.MARKETING_CAMPAIGN]: 'Marketing campaign',
		[DemandOverrideReasonEnum.INVENTORY_CONSTRAINT]: 'Inventory constraint',
		[DemandOverrideReasonEnum.NEW_CUSTOMER]: 'New customer',
		[DemandOverrideReasonEnum.MARKET_TREND]: 'Market trend',
		[DemandOverrideReasonEnum.MANUAL_ADJUSTMENT]: 'Manual adjustment',
		[DemandOverrideReasonEnum.OTHER]: 'Other',
	};
