export const getInitials = (name: string, limit = 2): string =>
	name
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase())
		.join('')
		.slice(0, Math.min(limit, 2));

export const enumToText = (
	enumValue?: string | null,
	allCaps = true
): string => {
	if (!enumValue) return '';

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
			/^[A-Z0-9]{2,}$/.test(word)
				? word
				: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
};

export const deepTrim = <T>(obj: T): T => {
	if (typeof obj === 'string') {
		return obj.trim() as T;
	}
	if (Array.isArray(obj)) {
		return obj.map(deepTrim) as T;
	}
	if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [key, deepTrim(value)])
		) as T;
	}
	return obj;
};

export const humanizeKey = (key: string): string =>
	key
		.replaceAll(/([a-z])([A-Z])/g, '$1 $2')
		.replaceAll(/([A-Za-z])(\d+)/g, '$1 $2')
		.replaceAll(/_/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim()
		.replaceAll(/\b\w/g, (char) => char.toUpperCase());
