import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { auth } from 'src/common/auth';

/**
 * The single place where the API decides what counts as a valid credential.
 *
 * Recognised today: a Better Auth session — cookie, or
 * `Authorization: Bearer <session-token>` via the `bearer()` plugin.
 *
 * New credential types (service API keys, signed webhook tokens, …) belong here
 * as additional branches before the `super.canActivate()` fallback. Whatever is
 * added must resolve identity from the caller's own credential and populate
 * `request.session` / `request.user` — never trust a caller-supplied user id.
 */

type GuardedRequest = {
	session?: unknown;
};

@Injectable()
export class CustomAuthGuard extends AuthGuard implements CanActivate {
	constructor(reflector: Reflector) {
		super(reflector, { auth });
	}

	override async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<GuardedRequest>();

		// Registered both globally and on individual controllers; the second pass
		// reuses what the first resolved instead of hitting the database again.
		if (request.session) {
			return true;
		}

		return super.canActivate(context) as Promise<boolean>;
	}
}
