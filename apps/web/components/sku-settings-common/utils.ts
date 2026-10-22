import type {
	GetSkuSettingsResponseType,
	SkuChannelPresence,
	SkuColumnType,
} from '@repo/types';
import { isDuplicateRuleColumn, normalizeCellValue } from './column-rules';
import type { EditableRow } from './types';

export const AUTOSAVE_DEBOUNCE_MS = 500;

export const EMPTY_CHANNELS: SkuChannelPresence = {
	shopify: false,
	bluebox: false,
	simplydepo: false,
};

export const toEditable = (
	row: GetSkuSettingsResponseType['data'][number]
): EditableRow => ({
	...row,
	channels: row.channels ?? EMPTY_CHANNELS,
	_customFields: { ...((row.customFields as Record<string, string>) ?? {}) },
});

/** Snapshot of every row's custom fields, keyed by sku — the autosave baseline. */
export const snapshotFields = (rows: EditableRow[]) =>
	Object.fromEntries(rows.map((r) => [r.sku, { ...r._customFields }] as const));

/** columnId → set of normalized values that appear more than once (non-empty). */
export const buildDuplicateValuesByColumn = (
	rows: EditableRow[],
	columns: SkuColumnType[]
): Map<string, Set<string>> => {
	const result = new Map<string, Set<string>>();

	for (const col of columns) {
		if (!isDuplicateRuleColumn(col.name)) continue;

		const counts = new Map<string, number>();
		for (const row of rows) {
			const value = normalizeCellValue(row._customFields[col.id]);
			if (!value) continue;
			counts.set(value, (counts.get(value) ?? 0) + 1);
		}

		const duplicates = new Set<string>();
		for (const [value, count] of counts) {
			if (count > 1) duplicates.add(value);
		}
		result.set(col.id, duplicates);
	}

	return result;
};
