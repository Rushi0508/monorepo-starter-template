import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, emailOTP } from 'better-auth/plugins';
import { config } from './env-config';

const DAY_SECONDS = 24 * 60 * 60;

export const STATIC_OTP = '123456';

const isProduction = config.environment === 'production';

const prismaClient = new PrismaClient({
	adapter: new PrismaPg({ connectionString: config.urls.db }),
});

export const auth = betterAuth({
	database: prismaAdapter(prismaClient, { provider: 'postgresql' }),
	secret: config.betterAuthSecret,
	baseURL: config.betterAuthUrl,
	basePath: '/api/auth',
	trustedOrigins: config.urls.cors,
	onAPIError: {
		errorURL: `${config.urls.frontend}/login`,
	},
	session: {
		expiresIn: 30 * DAY_SECONDS,
		updateAge: DAY_SECONDS,
	},
	advanced: {
		database: {
			generateId: false,
		},
		...(isProduction && {
			defaultCookieAttributes: {
				sameSite: 'none',
				secure: true,
			},
		}),
	},
	plugins: [
		bearer(),
		emailOTP({
			otpLength: STATIC_OTP.length,
			expiresIn: 10 * 60,
			allowedAttempts: 3,
			generateOTP: () => STATIC_OTP,
			async sendVerificationOTP({ email, otp }) {
				console.log(`OTP ${otp} for ${email}`);
			},
		}),
	],
	databaseHooks: {
		user: {
			create: {
				before: async (user) => ({
					data: {
						...user,
						name: user.name || user.email.split('@')[0] || user.email,
					},
				}),
			},
		},
	},
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
