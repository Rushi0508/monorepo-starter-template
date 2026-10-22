import {
	ChannelEnum,
	DemandOverrideReasonEnum,
	ForecastMethodTypeEnum,
} from '@repo/enums';
import { z } from 'zod';

/** "YYYY-MM" — the month grain every demand plan window is expressed in. */
export const PeriodSchema = z
	.string()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected a month in YYYY-MM format');

export const DemandPlanChannelScopeSchema = z.object({
	channel: z.enum(ChannelEnum),
	skuSettingIds: z.array(z.uuid()).min(1, 'Select at least one SKU'),
});

export const CreateDemandPlanSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.max(120, 'Name is too long'),
	notes: z.string().trim().max(2000, 'Notes are too long').optional(),
	horizonEnd: PeriodSchema,
	scope: z
		.array(DemandPlanChannelScopeSchema)
		.min(1, 'Select at least one channel'),
});

export const FinalizeDemandPlanSchema = z.object({
	notes: z.string().trim().max(2000, 'Notes are too long').optional(),
});

/**
 * Ratios, never 0–100: 0.15 is fifteen percent. Messages are worded in percent
 * because that is the unit the field is typed in.
 */
const ThresholdSchema = z
	.number('Enter a percentage')
	.min(0, 'Must be 0% or more')
	.max(1, 'Must be 100% or less');

export const DemandPlanThresholdsSchema = z
	.object({
		flagOverrideAbovePct: ThresholdSchema,
		requireReasonAbovePct: ThresholdSchema,
	})
	.refine(
		(value) => value.requireReasonAbovePct >= value.flagOverrideAbovePct,
		{
			message: 'Must be at or above the flag threshold',
			path: ['requireReasonAbovePct'],
		}
	);

export const CreateDemandScenarioSchema = z.object({
	basePlanId: z.uuid(),
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.max(120, 'Name is too long'),
	notes: z.string().trim().max(2000, 'Notes are too long').optional(),
});

export const SetForecastMethodSchema = z
	.object({
		channel: z.enum(ChannelEnum),
		skuSettingId: z.uuid(),
		method: z.enum(ForecastMethodTypeEnum),
		/** STATIC_GROWTH — month-over-month rate as a ratio, 0.05 is five percent. */
		growthPct: z
			.number()
			.min(-1, 'Minimum growth rate is -100%')
			.max(10, 'Maximum growth rate is 1000%')
			.nullish(),
		/** HISTORICAL_AVERAGE — trailing window in months. */
		windowMonths: z
			.number()
			.int()
			.min(1, 'Enter a window in months')
			.max(60, 'Window is too long')
			.nullish(),
	})
	.refine(
		(value) =>
			value.method !== ForecastMethodTypeEnum.STATIC_GROWTH ||
			value.growthPct != null,
		{ message: 'Enter a growth rate', path: ['growthPct'] }
	)
	.refine(
		(value) =>
			value.method !== ForecastMethodTypeEnum.HISTORICAL_AVERAGE ||
			value.windowMonths != null,
		{ message: 'Enter a window in months', path: ['windowMonths'] }
	);

/**
 * One typed cell. `units` of null clears the override, so the cell falls back
 * to whatever the forecast method produces.
 */
export const SetDemandEntrySchema = z.object({
	channel: z.enum(ChannelEnum),
	skuSettingId: z.uuid(),
	period: PeriodSchema,
	units: z.number().int().min(0).nullable(),
	reason: z.enum(DemandOverrideReasonEnum).optional(),
	note: z.string().trim().max(500).optional(),
});
