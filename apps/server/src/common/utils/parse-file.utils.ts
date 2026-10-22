import type { Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

interface RawCsvRow {
	[key: string]: string | number | null | undefined;
}

export type { RawCsvRow };

/**
 * Reads an Excel/CSV buffer and returns the parsed rows from the first sheet.
 */
export function parseWorkbookToRows(
	buffer: Buffer,
	logger: Logger,
	options?: { raw?: boolean }
): RawCsvRow[] {
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(buffer, {
			type: 'buffer',
			raw: options?.raw ?? false,
		});
	} catch (error) {
		logger.error(
			`Failed to read file from buffer: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new BadRequestException('Invalid file format or corrupted file.');
	}

	const sheetName = workbook.SheetNames[0];
	if (!sheetName) {
		throw new BadRequestException('File contains no sheets.');
	}

	const worksheet = workbook.Sheets[sheetName];
	if (!worksheet) {
		throw new BadRequestException(`Worksheet '${sheetName}' not found.`);
	}

	const rows: RawCsvRow[] = XLSX.utils.sheet_to_json(worksheet, {
		header: 0,
		raw: false,
		defval: null,
	});

	if (!rows || rows.length === 0) {
		throw new BadRequestException('File is empty or contains no data rows.');
	}

	return rows;
}

/**
 * Validates that all expected headers are present in the first row's keys.
 */
export function validateCsvHeaders(
	firstRow: RawCsvRow | undefined,
	expectedHeaders: readonly string[]
): void {
	if (!firstRow) {
		throw new BadRequestException('File is empty or has no headers.');
	}

	const actualHeaders = new Set(Object.keys(firstRow).map((h) => h.trim()));
	const missing = expectedHeaders.filter((h) => !actualHeaders.has(h));

	if (missing.length > 0) {
		throw new BadRequestException(
			`Missing required columns in your file: ${missing.join(', ')}.\n` +
				`Required columns: ${expectedHeaders.join(', ')}`
		);
	}
}

/**
 * Case-insensitive enum matching against allowed values.
 * Pushes to rowErrors if no match found.
 */
export function normalizeEnumLike<T extends readonly string[]>(
	fieldLabel: string,
	value: string | undefined,
	allowed: T,
	rowIndex: number,
	rowErrors: string[]
): T[number] | undefined {
	if (!value) return undefined;
	const normalized = value.trim().toLowerCase();
	const match = allowed.find((v) => v.toLowerCase() === normalized);
	if (!match) {
		rowErrors.push(
			`Row ${rowIndex}: Invalid ${fieldLabel} '${value}'. Must be one of: ${allowed.join(', ')} (case-insensitive)`
		);
		return '';
	}
	return match;
}
