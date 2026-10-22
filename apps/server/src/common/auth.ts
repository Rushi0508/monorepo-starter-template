import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
import { emailOtpTemplate, sendMail } from '@repo/mail';
import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware } from 'better-auth/api';
import { bearer, emailOTP, mcp } from 'better-auth/plugins';
import { config } from './env-config';

const adapter = new PrismaPg({
	connectionString: config.urls.db,
	ssl: {
		rejectUnauthorized: false,
	},
});

const prismaClient = new PrismaClient({
	adapter,
});

const isProduction = config.environment === 'production';

const DAY_SECONDS = 24 * 60 * 60;

export const auth = betterAuth({
	database: prismaAdapter(prismaClient, {
		provider: 'postgresql',
	}),
	onAPIError: {
		errorURL: `${config.urls.frontend}/login`,
	},
	trustedOrigins: config.urls.cors,
	basePath: '/api/auth',
	session: {
		expiresIn: 30 * DAY_SECONDS,
		updateAge: DAY_SECONDS,
	},
	secret: config.betterAuthSecret,
	baseURL: config.betterAuthUrl,
	experimental: {
		joins: true,
	},
	advanced: {
		database: {
			generateId: false,
		},
		defaultCookieAttributes: {
			sameSite: 'None',
			secure: true,
		},
	},
	socialProviders: {
		google: {
			clientId: config.google.clientId,
			clientSecret: config.google.clientSecret,
			prompt: 'select_account',
			mapProfileToUser: (profile) => ({
				name: profile.name,
				image: profile.picture,
				emailVerified: profile.email_verified ?? false,
			}),
		},
	},
	plugins: [
		bearer(),
		emailOTP({
			otpLength: 6,
			expiresIn: 10 * 60,
			allowedAttempts: 3,
			disableSignUp: true,
			...(!isProduction && {
				generateOTP: () => '123456',
			}),
			async sendVerificationOTP({ email, otp, type }) {
				if (type === 'sign-in') {
					if (isProduction) {
						sendMail(config.mail, {
							to: email,
							subject: 'Sauero - One-Time Password (OTP)',
							html: emailOtpTemplate({ otp }),
						});
					} else {
						console.log(`OTP: ${otp} for email: ${email}`);
					}
				}
			},
		}),
		mcp({
			loginPage: `${config.urls.frontend}/login`,
			resource: config.mcp.publicUrl || undefined,
			oidcConfig: {
				loginPage: `${config.urls.frontend}/login`,
				consentPage: `${config.urls.frontend}/consent`,
				allowDynamicClientRegistration: true,
				accessTokenExpiresIn: 60 * 60,
				refreshTokenExpiresIn: 30 * DAY_SECONDS,
			},
		}),
	],
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const dbUser = await prismaClient.user.findUnique({
						where: {
							email: user.email,
						},
					});
					if (!dbUser) {
						throw new APIError('UNAUTHORIZED', {
							message: 'User is not added in the system.',
						});
					}
					user.id = dbUser.id;
					return {
						data: {
							...user,
							id: dbUser.id,
						},
					};
				},
			},
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Guard both the send-OTP and verify-OTP endpoints
			if (
				ctx.path !== '/email-otp/send-verification-otp' &&
				ctx.path !== '/sign-in/email-otp'
			)
				return;

			const body = ctx.body as { email?: string } | undefined;
			if (!body?.email) return;

			// Check YOUR users table — block unknown emails with a clear message
			const user = await prismaClient.user.findUnique({
				where: { email: body.email },
				select: { id: true },
			});

			if (!user) {
				throw new APIError('UNAUTHORIZED', {
					message: 'User is not added in the system.',
				});
			}
		}),
	},
	// MCPOptions from better-auth/plugins/mcp is not exported; cast so declaration
	// emit (declaration: true) does not fail with TS4023.
}) as unknown as ReturnType<typeof betterAuth>;

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
