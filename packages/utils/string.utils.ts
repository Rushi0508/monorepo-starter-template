export const getInitials = (name: string, limit: number = 2) => {
	limit = Math.min(limit, 2);
	return name
		?.split(' ')
		?.map((word) => word.charAt(0).toUpperCase())
		?.join('')
		?.slice(0, limit)
		?.toUpperCase();
};

export const enumToText = (
	enumValue?: string | null,
	allCaps = true
): string => {
	if (!enumValue) return '';

	// Split snake_case and camelCase/PascalCase into words.
	// Only lowercase→Upper (not digit→Upper) so B2B / A1B stay intact.
	const words = enumValue
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.trim()
		.split(/\s+/);

	if (allCaps) {
		return words.map((word) => word.toUpperCase()).join(' ');
	}

	return words
		.map((word) =>
			// Preserve existing acronyms like API, URL, ID
			/^[A-Z0-9]{2,}$/.test(word)
				? word
				: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
};

export function formatCurrency(
	amount: number,
	currency: string = 'USD'
): string {
	// Collapse -0 / tiny float noise so UI never shows "-$0"
	const rounded = Math.round(amount * 10) / 10;
	const value =
		Object.is(rounded, -0) || Math.abs(rounded) < 1e-9 ? 0 : rounded;

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	}).format(value);
}

export const deepTrim = (obj: unknown): unknown => {
	if (typeof obj === 'string') {
		return obj.trim();
	} else if (Array.isArray(obj)) {
		return obj.map(deepTrim);
	} else if (typeof obj === 'object' && obj !== null) {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [key, deepTrim(value)])
		);
	}
	return obj;
};

export const normalizeText = (text: string) =>
	text
		.trim()
		.replaceAll(/[^a-zA-Z0-9\s]/g, '') // remove special chars
		.replaceAll(/\s+/g, ' ')
		.toUpperCase();

export const areValuesDifferent = (
	existingValue: unknown,
	updatedValue: unknown
): boolean => {
	if (
		typeof existingValue !== 'object' ||
		existingValue === null ||
		typeof updatedValue !== 'object' ||
		updatedValue === null
	) {
		return existingValue !== updatedValue;
	}

	return JSON.stringify(existingValue) !== JSON.stringify(updatedValue);
};

export const humanizeKey = (key: string): string => {
	return key
		.replaceAll(/([a-z])([A-Z])/g, '$1 $2')
		.replaceAll(/([A-Za-z])(\d+)/g, '$1 $2')
		.replaceAll(/_/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim()
		.replaceAll(/\b\w/g, (char) => char.toUpperCase());
};
