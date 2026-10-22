import { BUSINESS_TIME_ZONE } from '@repo/constants';

type FolkFieldOwner = 'sauero' | 'folk';

export type FolkFieldType =
	| 'textField'
	| 'numericField'
	| 'dateField'
	| 'singleSelect';

type FolkFieldDefinition = {
	name: string;
	owner: FolkFieldOwner;
	type: FolkFieldType;
	enabled?: boolean;
};

export const FOLK_FIELDS = {
	firstOrderDate: 'First Order Date (auto)',
	lastOrderDate: 'Last Order Date (auto)',
	lastOrderQuantity: 'Last Order Quantity (auto)',
	lastOrderValue: 'Last Order Value (auto)',
	averageOrderSize: 'Average Order Size (auto)',
	lifetimeRevenue: 'Revenue Lifetime (auto)',
	lifetimeOrders: 'Orders Lifetime (auto)',
	daysSinceLastOrder: 'Days Since Last Order (auto)',
	reorderDue: 'Reorder Due (auto)',
	storeCount: 'Store Count (auto)',
	retailVelocity: 'Retail Velocity (auto)',
	metricsAsOf: 'Metrics As Of (auto)',
	saueroCustomerId: 'Sauero Customer ID (auto)',
	status: 'Status',
	accountType: 'Account Type',
	sdCustomerId: 'SD Customer ID',
} as const;

export const FOLK_FIELD_OWNERS: Record<string, FolkFieldDefinition> = {
	[FOLK_FIELDS.firstOrderDate]: {
		name: FOLK_FIELDS.firstOrderDate,
		owner: 'sauero',
		type: 'dateField',
		enabled: true,
	},
	[FOLK_FIELDS.lastOrderDate]: {
		name: FOLK_FIELDS.lastOrderDate,
		owner: 'sauero',
		type: 'dateField',
		enabled: true,
	},
	[FOLK_FIELDS.lastOrderQuantity]: {
		name: FOLK_FIELDS.lastOrderQuantity,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.lastOrderValue]: {
		name: FOLK_FIELDS.lastOrderValue,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.averageOrderSize]: {
		name: FOLK_FIELDS.averageOrderSize,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.lifetimeRevenue]: {
		name: FOLK_FIELDS.lifetimeRevenue,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.lifetimeOrders]: {
		name: FOLK_FIELDS.lifetimeOrders,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.daysSinceLastOrder]: {
		name: FOLK_FIELDS.daysSinceLastOrder,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.reorderDue]: {
		name: FOLK_FIELDS.reorderDue,
		owner: 'sauero',
		type: 'textField',
		// Disabled until Mark defines the reorder-due rule.
		enabled: false,
	},
	[FOLK_FIELDS.storeCount]: {
		name: FOLK_FIELDS.storeCount,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.retailVelocity]: {
		name: FOLK_FIELDS.retailVelocity,
		owner: 'sauero',
		type: 'numericField',
		enabled: true,
	},
	[FOLK_FIELDS.metricsAsOf]: {
		name: FOLK_FIELDS.metricsAsOf,
		owner: 'sauero',
		type: 'dateField',
		enabled: true,
	},
	[FOLK_FIELDS.saueroCustomerId]: {
		name: FOLK_FIELDS.saueroCustomerId,
		owner: 'sauero',
		type: 'textField',
		enabled: true,
	},
	[FOLK_FIELDS.status]: {
		name: FOLK_FIELDS.status,
		owner: 'folk',
		type: 'singleSelect',
	},
	[FOLK_FIELDS.accountType]: {
		name: FOLK_FIELDS.accountType,
		owner: 'folk',
		type: 'textField',
	},
	[FOLK_FIELDS.sdCustomerId]: {
		name: FOLK_FIELDS.sdCustomerId,
		owner: 'folk',
		type: 'textField',
	},
};

export function assertWritableCustomFields(
	fields: Record<string, unknown>
): void {
	for (const name of Object.keys(fields)) {
		const definition = FOLK_FIELD_OWNERS[name];
		if (definition?.owner !== 'sauero') {
			throw new Error(
				`Refused write to Folk field "${name}" — Sauero does not own it`
			);
		}
		if (definition.enabled === false) {
			throw new Error(
				`Refused write to Folk field "${name}" — field is disabled`
			);
		}
	}
}

export function isSaueroOwnedField(name: string): boolean {
	const definition = FOLK_FIELD_OWNERS[name];
	return Boolean(definition && definition.owner === 'sauero');
}

const folkDateParts = new Intl.DateTimeFormat('en-US', {
	timeZone: BUSINESS_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/**
 * The calendar date an instant falls on in the business timezone. Order times
 * are stored in UTC, so an evening order in the US would otherwise be dated
 * the following day.
 */
export function folkDateOf(instant: Date): string {
	const parts = Object.fromEntries(
		folkDateParts.formatToParts(instant).map((part) => [part.type, part.value])
	);
	return `${parts.year}-${parts.month}-${parts.day}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * Folk stores dates as YYYY-MM-DD. Normalising by string rather than by
 * re-parsing avoids the off-by-one where `new Date('2026-08-17')` is UTC
 * midnight and a local-time formatter renders it as the 16th.
 */
function toFolkDate(value: string | number): string | null {
	const text = String(value).trim();
	if (ISO_DATE.test(text)) return text;

	const usDate = US_DATE.exec(text);
	if (usDate) {
		const [, month, day, year] = usDate;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	const parsed = new Date(text);
	return Number.isNaN(parsed.getTime())
		? null
		: parsed.toISOString().slice(0, 10);
}

export function serializeFolkValue(
	fieldName: string,
	value: string | number | null | undefined
): string | null {
	const definition = FOLK_FIELD_OWNERS[fieldName];
	if (value === undefined || value === null || value === '') return null;
	if (!definition) return String(value);

	switch (definition.type) {
		case 'dateField': {
			return toFolkDate(value);
		}
		case 'numericField': {
			const num = typeof value === 'number' ? value : Number(value);
			return Number.isFinite(num) ? String(num) : null;
		}
		case 'singleSelect':
		case 'textField':
			return String(value);
		default:
			return String(value);
	}
}

export function asComparableFolkValue(
	fieldName: string,
	raw: unknown
): string | null {
	if (raw === undefined || raw === null) return null;
	if (Array.isArray(raw)) {
		const first = raw[0];
		if (first === undefined || first === null) return null;
		return asComparableFolkValue(fieldName, first);
	}

	const definition = FOLK_FIELD_OWNERS[fieldName];
	if (definition?.type === 'numericField') {
		const num = typeof raw === 'number' ? raw : Number(raw);
		return Number.isFinite(num) ? String(num) : null;
	}
	if (definition?.type === 'dateField') {
		const serialized = serializeFolkValue(fieldName, String(raw));
		return serialized === null ? null : String(serialized);
	}
	const text = String(raw).trim();
	return text === '' ? null : text;
}
