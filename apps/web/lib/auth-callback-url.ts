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

	const callbackOrigin = originOf(value);
	if (!callbackOrigin) {
		return '/';
	}

	const allowedOrigins = [
		originOf(envConfig.appUrl),
		originOf(envConfig.betterAuthUrl),
	].filter((origin): origin is string => Boolean(origin));

	if (allowedOrigins.includes(callbackOrigin)) {
		return value;
	}

	return '/';
}

export function isAbsoluteUrl(url: string): boolean {
	return url.startsWith('http://') || url.startsWith('https://');
}
