import { ChannelEnum } from '@repo/enums';
import { z } from 'zod';
import { paginationSchema } from '../shared/schema.js';

export const PLAN_CAP = 20;
export const GRID_SERIES_CAP = 20;
export const METHOD_CAP = 50;
export const PRICING_CAP = 20;
export const AUDIT_CAP = 25;
export const SCENARIO_CAP = 20;
export const COMPARE_ROW_CAP = 25;
export const ACCURACY_MISS_CAP = 20;

export const demandPlanningViews = [
	'plans',
	'operative',
	'plan',
	'grid',
	'forecast_methods',
	'pricing',
	'audits',
	'scenarios',
	'compare',
	'accuracy',
] as const;

export const demandPlanningInputSchema = z.object({
	view: z
		.enum(demandPlanningViews)
		.optional()
		.describe(
			'plans (default), operative, plan, grid, forecast_methods, pricing, audits, scenarios, compare, accuracy'
		),
	id: z
		.string()
		.optional()
		.describe(
			'Plan or scenario UUID (plan, grid, forecast_methods, pricing, audits)'
		),
	basePlanId: z
		.string()
		.optional()
		.describe('Scenarios view: only scenarios forked from this base plan'),
	planAId: z.string().optional().describe('Compare view: first plan UUID'),
	planBId: z.string().optional().describe('Compare view: second plan UUID'),
	demandPeriod: z
		.string()
		.optional()
		.describe('Accuracy view: month being scored, YYYY-MM'),
	lag: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Accuracy view: months ahead the forecast was made'),
	channels: z
		.array(z.nativeEnum(ChannelEnum))
		.optional()
		.describe('Accuracy view: channel filter'),
	skuSettingIds: z
		.array(z.string())
		.optional()
		.describe('Accuracy view: SKU setting UUIDs'),
	channel: z.string().optional().describe('Grid: limit series to one channel'),
	skuSettingId: z
		.string()
		.optional()
		.describe('Grid or pricing: one SKU setting UUID'),
	period: z
		.string()
		.optional()
		.describe('Grid: one month YYYY-MM, including history'),
	includeDetail: z
		.boolean()
		.optional()
		.describe(
			'Plan: SKU ids. Grid: forecast-month cells. Pricing: version history and cost components.'
		),
	...paginationSchema,
});

export type DemandPlanningInput = z.infer<typeof demandPlanningInputSchema>;
export type DemandPlanningView = (typeof demandPlanningViews)[number];
