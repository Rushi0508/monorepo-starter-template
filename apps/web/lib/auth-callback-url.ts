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

export function resolveOAuthContinueUrl(
	searchParams: URLSearchParams
): string | null {
	if (!searchParams.get('client_id') || !searchParams.get('response_type')) {
		return null;
	}

	const authBase = envConfig.betterAuthUrl.replace(/\/$/, '');
	if (!authBase) {
		return null;
	}

	return `${authBase}/api/auth/mcp/authorize?${searchParams.toString()}`;
}

export function toAbsoluteAuthCallbackUrl(callbackUrl: string): string {
	if (isAbsoluteUrl(callbackUrl)) {
		return callbackUrl;
	}
	const path = callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`;
	return `${envConfig.appUrl.replace(/\/$/, '')}${path}`;
}
