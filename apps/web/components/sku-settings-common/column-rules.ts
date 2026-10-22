/**
 * Column-name rules for the SKU settings grid (frontend UX only).
 * Match is a case-insensitive substring search on the column display name.
 * Copied into the common folder so the alternative grids don't depend on the
 * Handsontable implementation.
 */
export type SkuColumnRule = {
	/** Phrases to find in the column name (case-insensitive substring). */
	match: string[];
	/** When true, duplicate non-empty values in this column are highlighted. */
	duplicate: boolean;
};

export const SKU_COLUMN_RULES: SkuColumnRule[] = [
	{ match: ['upc code'], duplicate: true },
];

export const normalizeColumnName = (name: string): string =>
	name.trim().toLowerCase();

export const getColumnRule = (
	columnName: string
): SkuColumnRule | undefined => {
	const key = normalizeColumnName(columnName);
	return SKU_COLUMN_RULES.find((rule) =>
		rule.match.some((phrase) => key.includes(normalizeColumnName(phrase)))
	);
};

export const isDuplicateRuleColumn = (columnName: string): boolean =>
	Boolean(getColumnRule(columnName)?.duplicate);

export const normalizeCellValue = (value: unknown): string =>
	String(value ?? '')
		.trim()
		.toLowerCase();
