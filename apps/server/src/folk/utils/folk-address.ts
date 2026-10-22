import { US_STATES } from '@repo/constants';

export type ParsedFolkAddress = {
	address1: string;
	address2: string | null;
	city: string | null;
	provinceCode: string | null;
	zip: string | null;
	countryCode: 'US';
};

const STATE_CODES = new Set<string>(US_STATES.map((s) => s.value));

const STATE_ZIP = /^([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?$/;
const STATE_ONLY = /^([A-Za-z]{2})$/;
const ZIP_ONLY = /^(\d{5})(?:-\d{4})?$/;
const COUNTRY = /^(us|usa|u\.s\.a?\.?|united states(?: of america)?)$/i;
const UNIT = /\s+((?:ste|suite|unit|apt|#)\.?\s*[\w-]+)$/i;

const stateCode = (value: string) => {
	const code = value.toUpperCase();
	return STATE_CODES.has(code) ? code : null;
};

/**
 * Folk stores addresses as free text, usually "street, city, ST ZIP" as copied
 * from Google Maps. Returns whatever parts can be read; Shopify accepts a
 * partial address, and sample orders refuse to ship until it is complete.
 * Returns null only for an empty string.
 */
export function parseFolkAddress(raw: string): ParsedFolkAddress | null {
	const parts = raw
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.at(-1) && COUNTRY.test(parts.at(-1) as string)) parts.pop();

	const [street, ...rest] = parts;
	if (!street) return null;

	let provinceCode: string | null = null;
	let zip: string | null = null;

	const last = rest.at(-1);
	const stateZip = last?.match(STATE_ZIP);
	const stateOnly = last?.match(STATE_ONLY);
	const zipOnly = last?.match(ZIP_ONLY);

	if (stateZip) {
		provinceCode = stateCode(stateZip[1]);
		zip = stateZip[2];
		rest.pop();
	} else if (stateOnly && stateCode(stateOnly[1])) {
		provinceCode = stateCode(stateOnly[1]);
		rest.pop();
	} else if (zipOnly) {
		zip = zipOnly[1];
		rest.pop();
	}

	const unit = street.match(UNIT);

	return {
		address1: unit ? street.slice(0, unit.index).trim() : street,
		address2: unit ? unit[1] : null,
		city: rest.length ? rest.join(', ') : null,
		provinceCode,
		zip,
		countryCode: 'US',
	};
}
