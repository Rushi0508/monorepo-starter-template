import {
	DemandPlan,
	DemandPlanAudit,
	DemandPlanChannelFulfillmentCost,
	DemandPlanChannelPrice,
	DemandPlanChannelScope,
	DemandPlanCogs,
} from '@repo/db';
import type {
	ChannelEnum,
	DemandOverrideReasonEnum,
	ForecastMethodTypeEnum,
} from '@repo/enums';
import {
	CreateDemandPlanSchema,
	CreateDemandScenarioSchema,
	DemandPlanChannelScopeSchema,
	DemandPlanThresholdsSchema,
	FinalizeDemandPlanSchema,
	SetDemandEntrySchema,
	SetForecastMethodSchema,
} from '@repo/schemas';
import { z } from 'zod';

export type DemandPlanType = DemandPlan & {
	channelScopes: DemandPlanChannelScope[];
};

export type DemandPlanListItemType = DemandPlan & {
	totalCases: number;
	totalRevenue: number;
	overrideCount: number;
	createdBy: string | null;
	finalizedBy: string | null;
};

export type DemandPlanAuditType = DemandPlanAudit;

export type DemandForecastMethodType = {
	channel: string;
	skuSettingId: string;
	method: ForecastMethodTypeEnum;
	growthPct: number | null;
	windowMonths: number | null;
};

export type DemandPlanPricingType = {
	cogs: DemandPlanCogs[];
	channelFulfillmentCosts: DemandPlanChannelFulfillmentCost[];
	channelPrices: DemandPlanChannelPrice[];
};

export type CreateDemandPlanInput = z.infer<typeof CreateDemandPlanSchema>;
export type DemandPlanChannelScopeInput = z.infer<
	typeof DemandPlanChannelScopeSchema
>;
export type DemandPlanThresholdsInput = z.infer<
	typeof DemandPlanThresholdsSchema
>;
export type UpdateDemandPlanInput = Partial<CreateDemandPlanInput> &
	Partial<DemandPlanThresholdsInput>;
export type FinalizeDemandPlanInput = z.infer<typeof FinalizeDemandPlanSchema>;
export type CreateDemandScenarioInput = z.infer<
	typeof CreateDemandScenarioSchema
>;

export type SetForecastMethodInput = z.infer<typeof SetForecastMethodSchema>;

export type SetDemandEntryInput = z.infer<typeof SetDemandEntrySchema>;

export type DemandScenarioListItemType = DemandPlanListItemType & {
	basePlanName: string | null;
};
/**
 * One month of one series. The channel, SKU and month are not repeated here —
 * they come from the series that owns the cell and the key it sits under.
 */
export type DemandGridCellType = {
	actualUnits: number | null;
	actualRevenue: number | null;
	isPartialActual: boolean;

	statisticalUnits: number | null;
	planUnits: number | null;
	isOverride: boolean;
	isFlagged: boolean;
	overrideReason: DemandOverrideReasonEnum | null;
	overrideNote: string | null;

	pricePerUnit: number | null;
	cogsPerUnit: number | null;
	fulfillmentCostPerUnit: number | null;
	projectedRevenue: number | null;

	isEditable: boolean;
};

/** One SKU in one channel, across every column. */
export type DemandGridSeriesType = {
	channel: ChannelEnum;
	skuSettingId: string;
	/** Keyed by period, so a lookup is direct rather than a scan. */
	cells: Record<string, DemandGridCellType>;
};

export type DemandGridType = {
	/** Every column, January of the plan's year through the horizon end. */
	periods: string[];
	/** The first forecast month; everything before it is history. */
	firstForecastPeriod: string;
	series: DemandGridSeriesType[];
};

export type DemandComparisonPlanType = Pick<
	DemandPlan,
	'id' | 'name' | 'kind' | 'status' | 'planMonth' | 'horizonEnd'
>;

export type DemandComparisonRowType = {
	channel: ChannelEnum;
	skuSettingId: string;
	period: string;

	unitsA: number;
	unitsB: number;
	revenueA: number;
	revenueB: number;

	volumeEffect: number;
	priceEffect: number;
	scopeEffect: number;
};

export type DemandComparisonType = {
	planA: DemandComparisonPlanType;
	planB: DemandComparisonPlanType;
	periods: string[];
	rows: DemandComparisonRowType[];
	scopeDiff: { added: number; dropped: number };
};

export type DemandAccuracyType = {
	lag: number;
	planId: string;
	planName: string;
	/** "YYYY-MM" — the month the scoring plan was cut in */
	planMonth: string;
	forecast: number;
	actual: number;
	/** actual - forecast. Positive means demand was underestimated. */
	variance: number;
	/** max(0, 1 - |actual - forecast| / forecast) */
	accuracyPct: number;
};

export type DemandAccuracyMissType = {
	channel: string;
	skuSettingId: string;
	forecast: number;
	actual: number;
	variance: number;
	accuracyPct: number;
};

export type DemandAccuracyTrendPointType = {
	period: string;
	forecast: number;
	actual: number;
	variance: number;
	accuracyPct: number;
};

export type GetDemandAccuracyResponseType = {
	demandPeriod: string;
	lag: number;
	availablePeriods: string[];
	availableLags: number[];
	/** "YYYY-MM" — the plan month this period and lag require */
	expectedPlanMonth: string;
	summary: DemandAccuracyType | null;
	byChannel: (DemandAccuracyType & { channel: string })[];
	misses: DemandAccuracyMissType[];
	byLag: DemandAccuracyType[];
	trend: DemandAccuracyTrendPointType[];
	/**
	 * Net signed miss across every scored month as a share of total forecast.
	 * Positive means actuals ran above plan — demand was underestimated.
	 */
	bias: { pct: number; months: number } | null;
};

export type DemandImportResultType = {
	cells: number;
	series: number;
	periods: string[];
};
