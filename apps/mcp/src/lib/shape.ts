/**
 * Shared helpers for compact MCP response shaping.
 *
 * Tool responses are the dominant token cost in an MCP server — a single raw
 * dashboard payload runs ~25 KB (~6.4k tokens), roughly four times the entire
 * tool catalogue. Keep payloads small by default; deep fields are opt-in at the
 * tool layer.
 */

/** Drop null/undefined values and empty arrays from one level of an object. */
export function omitNulls<T extends Record<string, unknown>>(
	obj: T
): Partial<T> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === undefined) continue;
		if (Array.isArray(value) && value.length === 0) continue;
		out[key] = value;
	}
	return out as Partial<T>;
}

export function capArray<T>(items: T[], limit: number): T[] {
	if (limit <= 0) return [];
	return items.slice(0, limit);
}

/** Cap a list, reporting how many rows were dropped so the model knows. */
export function capWithMeta<T>(
	items: T[],
	limit: number
): { items: T[]; truncated?: number } {
	const total = items.length;
	return {
		items: capArray(items, limit),
		...(total > limit ? { truncated: total - limit } : {}),
	};
}

/**
 * MCP-side pagination over a full in-memory list (upstream APIs often have none).
 * `truncated` is how many rows remain after this page.
 */
export function pageWithMeta<T>(
	items: T[],
	page = 1,
	limit: number
): {
	items: T[];
	totalCount: number;
	page: number;
	limit: number;
	truncated?: number;
} {
	const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
	const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
	const totalCount = items.length;
	const start = (safePage - 1) * safeLimit;
	const sliced = items.slice(start, start + safeLimit);
	const remaining = Math.max(0, totalCount - safePage * safeLimit);
	return {
		items: sliced,
		totalCount,
		page: safePage,
		limit: safeLimit,
		...(remaining > 0 ? { truncated: remaining } : {}),
	};
}

/** Keep the most recent `count` entries of a chronologically ascending series. */
export function takeLast<T>(items: T[], count: number): T[] {
	if (count <= 0) return [];
	return items.slice(Math.max(0, items.length - count));
}

/** Round to 2dp. Money fields arrive with float noise that costs tokens. */
export function round2(n: number | null | undefined): number | undefined {
	if (n === null || n === undefined || !Number.isFinite(n)) return undefined;
	return Math.round(n * 100) / 100;
}

/** Deep-strip nulls, undefined and empty arrays from a JSON-serializable value. */
export function compactJson(value: unknown): unknown {
	if (value === null || value === undefined) return undefined;
	if (Array.isArray(value)) {
		return value.map(compactJson).filter((v) => v !== undefined);
	}
	if (typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			const compacted = compactJson(v);
			if (compacted === undefined) continue;
			if (Array.isArray(compacted) && compacted.length === 0) continue;
			out[k] = compacted;
		}
		return out;
	}
	return value;
}
