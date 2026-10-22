import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function parseFiltersFromParams<T extends Record<string, unknown>>(
	searchParams: URLSearchParams,
	defaultValues: T
): T {
	const result = { ...defaultValues };

	Object.keys(defaultValues).forEach((key) => {
		const value = searchParams.get(key);

		if (value == null) {
			return;
		}

		const defaultValue = defaultValues[key as keyof T];

		if (Array.isArray(defaultValue)) {
			(result as Record<string, unknown>)[key] = value.split(',');
		} else if (typeof defaultValue === 'number') {
			(result as Record<string, unknown>)[key] = Number(value);
		} else if (
			typeof defaultValue === 'boolean' ||
			value === 'true' ||
			value === 'false'
		) {
			(result as Record<string, unknown>)[key] = value === 'true';
		} else {
			(result as Record<string, unknown>)[key] = value;
		}
	});

	return result;
}

function buildParamString<T extends Record<string, unknown>>(
	filters: T
): string {
	const params = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (
			value == null ||
			value === '' ||
			(Array.isArray(value) && value.length === 0)
		) {
			return;
		}
		params.set(key, Array.isArray(value) ? value.join(',') : String(value));
	});

	return params.toString();
}

export function useQueryFilters<T extends Record<string, unknown>>(
	defaultValues: T
) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [filters, setFilters] = useState<T>(() =>
		parseFiltersFromParams(searchParams, defaultValues)
	);

	// Tracks the last param string we pushed so we can distinguish our own URL
	// updates from external ones (e.g. sidebar navigation stripping params).
	const lastPushedParams = useRef<string | null>(null);

	const defaultValuesRef = useRef(defaultValues);
	defaultValuesRef.current = defaultValues;

	// Sync state from URL when URL changes externally.
	useEffect(() => {
		if (lastPushedParams.current === searchParams.toString()) return;
		setFilters(parseFiltersFromParams(searchParams, defaultValuesRef.current));
	}, [searchParams]);

	// Push filter state into the URL.
	useEffect(() => {
		const newParamString = buildParamString(filters);
		if (lastPushedParams.current === newParamString) return;
		lastPushedParams.current = newParamString;
		router.replace(
			newParamString ? `${pathname}?${newParamString}` : pathname,
			{ scroll: false }
		);
	}, [filters, pathname, router]);

	return { filters, setFilters };
}
