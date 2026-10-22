import 'dotenv/config';

export const config = {
	host: process.env.HOST || '0.0.0.0',
	port: Number.parseInt(process.env.PORT || '3001', 10),
	betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
	betterAuthUrl: process.env.BETTER_AUTH_URL || '',
	urls: {
		frontend: process.env.FRONTEND_URL || '',
		cors:
			process.env.CORS_URLS?.split(',')
				.map((url) => url.trim())
				.filter(Boolean) || [],
		db: process.env.DATABASE_URL || '',
	},
	environment: process.env.NODE_ENV as 'development' | 'production' | 'staging',
	mail: {
		smtp: {
			host: process.env.SMTP_HOST || '',
			port: Number.parseInt(process.env.SMTP_PORT || '465', 10),
			auth: {
				user: process.env.SMTP_USER || '',
				pass: process.env.SMTP_PASSWORD || '',
			},
		},
		defaults: {
			from: process.env.SMTP_FROM || '',
			fromName: process.env.SMTP_FROM_NAME || 'Starter',
		},
	},
};
