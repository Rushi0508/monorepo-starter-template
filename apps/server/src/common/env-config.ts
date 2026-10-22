import 'dotenv/config';

export const config = {
	host: process.env.HOST || '0.0.0.0',
	port: Number.parseInt(process.env.PORT || '3001', 10),
	environment: (process.env.NODE_ENV || 'development') as
		| 'development'
		| 'production'
		| 'staging',
	betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
	betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
	urls: {
		frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
		cors:
			process.env.CORS_URLS?.split(',')
				.map((url) => url.trim())
				.filter(Boolean) || [],
		db: process.env.DATABASE_URL || '',
	},
};
