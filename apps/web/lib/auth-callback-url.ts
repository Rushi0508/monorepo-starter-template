import { envConfig } from '@/env-config';

function originOf(url: string): string | null {
	try {
		return new URL(url).origin;
	} catch {
		return null;
	}
}

export function resolveAuthCallbackUrl(raw: string | null | undefined): string {
	const value = raw?.trim() || '/';

	if (value.startsWith('/') && !value.startsWith('//')) {
		return value;
	}

	return originOf(value) === originOf(envConfig.appUrl) ? value : '/';
}
