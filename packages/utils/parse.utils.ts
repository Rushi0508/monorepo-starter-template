import { jsonrepair } from 'jsonrepair';

export const safeParseJson = (input: string) => {
	try {
		return JSON.parse(input);
	} catch {
		try {
			const repairedJson = jsonrepair(input);
			return JSON.parse(repairedJson);
		} catch {
			throw new Error(`Invalid JSON: ${input}`);
		}
	}
};

export const isNotNullOrUndefined = (value: unknown) => {
	return value !== null && value !== undefined;
};

export const isEmpty = (value: unknown): boolean => {
	if (value === null || value === undefined) return true;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime());
	}
	if (typeof value === 'string') return value.trim() === '';
	if (typeof value === 'number') return false;
	if (typeof value === 'boolean') return false;
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === 'object') return Object.keys(value).length === 0;
	return false;
};
