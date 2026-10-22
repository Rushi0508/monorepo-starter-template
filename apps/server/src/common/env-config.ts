import 'dotenv/config';

export const config = {
	host: process.env.HOST || '0.0.0.0',
	port: Number.parseInt(process.env.PORT || '3001', 10),
	betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
	betterAuthUrl: process.env.BETTER_AUTH_URL || '',
	mcp: {
		publicUrl: process.env.MCP_PUBLIC_URL || '',
	},
	urls: {
		frontend: process.env.FRONTEND_URL || '',
		api: process.env.API_URL || '',
		cors:
			process.env.CORS_URLS?.split(',')
				.map((url) => url.trim())
				.filter(Boolean) || [],
		db: process.env.DATABASE_URL || '',
	},
	environment: process.env.NODE_ENV as 'development' | 'production' | 'staging',
	s3: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
		bucketName: process.env.S3_BUCKET_NAME || '',
		region: process.env.S3_REGION || '',
	},
	sqs: {
		region: process.env.SQS_REGION || '',
		accessKeyId: process.env.SQS_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY || '',
		shopifyQueueUrl: process.env.SQS_SHOPIFY_QUEUE_URL || '',
		gmailQueueUrl: process.env.SQS_GMAIL_QUEUE_URL || '',
	},
	shopify: {
		clientId: process.env.SHOPIFY_APP_CLIENT_ID || '',
		clientSecret: process.env.SHOPIFY_APP_CLIENT_SECRET || '',
		shop: process.env.SHOPIFY_SHOP || '',
		apiVersion: process.env.SHOPIFY_API_VERSION || '2026-04',
	},
	blueBox: {
		baseUrl: process.env.BLUEBOX_API_URL || 'https://bluebox-api.shipidf.com',
		username: process.env.BLUEBOX_USERNAME || '',
		password: process.env.BLUEBOX_PASSWORD || '',
	},
	qbo: {
		clientId: process.env.QBO_CLIENT_ID || '',
		clientSecret: process.env.QBO_CLIENT_SECRET || '',
		redirectUri: process.env.QBO_REDIRECT_URI || '',
		environment: (process.env.QBO_ENVIRONMENT || 'production') as
			| 'sandbox'
			| 'production',
	},
	google: {
		clientId: process.env.GOOGLE_CLIENT_ID || '',
		clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
		aiApiKey: process.env.GOOGLE_AI_API_KEY || '',
		gmailRedirectUri:
			process.env.GOOGLE_GMAIL_REDIRECT_URI ||
			'http://localhost:3001/api/gmail/callback',
	},
	zapier: {
		clientId: process.env.ZAPIER_CREDENTIALS_CLIENT_ID || '',
		clientSecret: process.env.ZAPIER_CREDENTIALS_CLIENT_SECRET || '',
		simplyDepoConnectionId: process.env.ZAPIER_SIMPLYDEPO_CONNECTION_ID || '',
	},
	folk: {
		apiKey: process.env.FOLK_API_KEY || '',
		apiBaseUrl: process.env.FOLK_API_BASE_URL || 'https://api.folk.app/v1',
		webhookSecret: process.env.FOLK_WEBHOOK_SECRET || '',
		webhookTargetUrl: process.env.FOLK_WEBHOOK_TARGET_URL || '',
	},
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
			fromName: process.env.SMTP_FROM_NAME || 'Sauero',
		},
	},
};
