import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { DEFAULT_TIME_ZONE } from '@repo/constants';
import { isValidTimeZone } from '@repo/utils';

export const TIMEZONE_HEADER = 'x-timezone';

/**
 * The IANA timezone of the client that made the request, sent by the web app as
 * an `x-timezone` header.
 */
export const ClientTimezone = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): string => {
		const header = ctx.switchToHttp().getRequest<{
			headers?: Record<string, string | string[] | undefined>;
		}>().headers?.[TIMEZONE_HEADER];

		const timeZone = Array.isArray(header) ? header[0] : header;

		return isValidTimeZone(timeZone) ? (timeZone as string) : DEFAULT_TIME_ZONE;
	}
);
