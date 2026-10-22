import { z } from 'zod';

/** Number of daily points returned when `includeTrend` is set. */
export const TREND_DAYS = 14;
/** Top SKUs returned by default. */
export const TOP_SKU_CAP = 10;
/** Session rows returned when `includeSessions` is set. */
export const SESSION_ROW_CAP = 8;

// Every `.describe()` string is loaded into the model's context on every
// request, so keep them short and factual.
export const dashboardInputSchema = z.object({
	dateStart: z
		.string()
		.optional()
		.describe('ISO-8601 start date (inclusive), e.g. 2024-01-01'),
	dateEnd: z
		.string()
		.optional()
		.describe('ISO-8601 end date (inclusive), e.g. 2024-12-31'),
	includeTrend: z
		.boolean()
		.optional()
		.describe(`Include the last ${TREND_DAYS} daily points (default false)`),
	includeSessions: z
		.boolean()
		.optional()
		.describe('Include traffic/session breakdown (default false)'),
});

export type DashboardInput = z.infer<typeof dashboardInputSchema>;
