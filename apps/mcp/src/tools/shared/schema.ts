import { z } from 'zod';

/** Shared pagination — keep .describe() short (loaded every request). */
export const paginationSchema = {
	page: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('Page number (default 1)'),
	limit: z
		.number()
		.int()
		.positive()
		.max(100)
		.optional()
		.describe('Items per page (default 10, max 100)'),
};

export const dateRangeSchema = {
	dateStart: z
		.string()
		.optional()
		.describe('ISO-8601 start date (inclusive), e.g. 2024-01-01'),
	dateEnd: z
		.string()
		.optional()
		.describe('ISO-8601 end date (inclusive), e.g. 2024-12-31'),
};

export const orderDateRangeSchema = {
	orderDateStart: z
		.string()
		.optional()
		.describe('ISO-8601 order start date (inclusive)'),
	orderDateEnd: z
		.string()
		.optional()
		.describe('ISO-8601 order end date (inclusive)'),
};

/** Strip MCP-only flags before forwarding params to the API. */
export function omitKeys<T extends Record<string, unknown>>(
	obj: T,
	keys: string[]
): Record<string, unknown> {
	const out: Record<string, unknown> = { ...obj };
	for (const key of keys) {
		delete out[key];
	}
	return out;
}
