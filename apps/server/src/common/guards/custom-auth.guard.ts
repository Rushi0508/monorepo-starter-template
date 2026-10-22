import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from 'src/common/auth';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * The single place where the API decides what counts as a valid credential.
 *
 * Recognised today:
 *   1. An MCP OAuth access token — issued by the `mcp()` plugin and stored in
 *      `oauthAccessToken`. The stock AuthGuard cannot resolve these, so the
 *      request goes to `auth.api.getMcpSession()` first.
 *   2. A Better Auth session — cookie, or `Authorization: Bearer <session-token>`
 *      via the `bearer()` plugin. Falls through to the stock AuthGuard.
 *
 * New credential types (service API keys, signed webhook tokens, …) belong here
 * as additional branches before the `super.canActivate()` fallback. Whatever is
 * added must resolve identity from the caller's own credential and populate
 * `request.session` / `request.user` — never trust a caller-supplied user id.
 */

// `auth` is exported with a widened type (see auth.ts) because the mcp plugin's
// options type is not exported and breaks declaration emit. Re-narrow the one
// endpoint needed here.
type McpSessionApi = {
	getMcpSession: (opts: { headers: Headers }) => Promise<{
		userId?: string | null;
		accessTokenExpiresAt?: string | null;
	} | null>;
};

type GuardedRequest = {
	headers: Record<string, string | string[] | undefined>;
	session?: unknown;
	user?: unknown;
};

@Injectable()
export class CustomAuthGuard extends AuthGuard implements CanActivate {
	@Inject(PrismaService) private readonly prisma!: PrismaService;
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

		const authorization = request.headers.authorization;
		const hasBearer =
			typeof authorization === 'string' &&
			authorization.toLowerCase().startsWith('bearer ');

		if (hasBearer) {
			const mcpSession = await (
				auth.api as unknown as McpSessionApi
			).getMcpSession({
				headers: fromNodeHeaders(request.headers),
			});

			if (mcpSession?.userId) {
				if (
					mcpSession.accessTokenExpiresAt &&
					new Date(mcpSession.accessTokenExpiresAt) < new Date()
				) {
					throw new UnauthorizedException('MCP access token expired');
				}
				const user = await this.prisma.user.findUnique({
					where: { id: mcpSession.userId },
				});
				if (!user) {
					throw new UnauthorizedException('User not found');
				}

				const now = new Date();
				const session = {
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						emailVerified: user.emailVerified,
						image: user.image,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
					},
					session: {
						id: `mcp-oauth-${user.id}`,
						userId: user.id,
						token: '',
						expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
						createdAt: now,
						updatedAt: now,
					},
				};
				request.session = session;
				request.user = session.user;
				return true;
			}
		}

		// Not an MCP token — fall back to the normal cookie/session-bearer check.
		return super.canActivate(context) as Promise<boolean>;
	}
}
