import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { config } from './common/env-config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// For MCP to work in local - unreachable in Production
const AUTH_BASE = `${config.betterAuthUrl.replace(/\/$/, '')}/api/auth`;
async function proxyToAuth(
	req: Request,
	res: Response,
	targetPath: string,
	method: 'GET' | 'POST' = 'GET'
): Promise<void> {
	try {
		const headers: Record<string, string> = {
			Accept: req.headers.accept ?? 'application/json',
		};
		const contentType = req.headers['content-type'];
		if (typeof contentType === 'string') {
			headers['Content-Type'] = contentType;
		}

		const upstream = await fetch(`${AUTH_BASE}${targetPath}`, {
			method,
			headers,
			body:
				method === 'POST'
					? typeof req.body === 'string'
						? req.body
						: JSON.stringify(req.body ?? {})
					: undefined,
		});

		const responseContentType = upstream.headers.get('content-type');
		if (responseContentType) {
			res.setHeader('Content-Type', responseContentType);
		}
		res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
	} catch (error) {
		console.error(`Failed to proxy ${method} ${targetPath}:`, error);
		res.status(502).json({ message: 'Auth discovery proxy failed' });
	}
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		rawBody: true,
	});

	app.useBodyParser('json', { limit: '10mb' });
	app.useBodyParser('urlencoded', { extended: true, limit: '10mb' });

	app.use(cookieParser());

	app.enableCors({
		origin: config.urls.cors,
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors) => {
				return new BadRequestException({
					message: 'Something went wrong',
					data: errors,
				});
			},
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: false,
			},
		})
	);

	app.useGlobalFilters(new GlobalExceptionFilter());
	app.setGlobalPrefix('api');
	app.useLogger(app.get(Logger));

	// MCP OAuth clients probe host-root discovery; Better Auth lives under /api/auth.
	// For MCP to work in local - unreachable in Production
	const expressApp = app.getHttpAdapter().getInstance();
	expressApp.get(
		'/.well-known/oauth-authorization-server',
		(req: Request, res: Response) =>
			void proxyToAuth(req, res, '/.well-known/oauth-authorization-server')
	);
	expressApp.get(
		'/.well-known/openid-configuration',
		(req: Request, res: Response) =>
			void proxyToAuth(req, res, '/.well-known/oauth-authorization-server')
	);
	expressApp.post(
		'/register',
		(req: Request, res: Response) =>
			void proxyToAuth(req, res, '/mcp/register', 'POST')
	);

	const swaggerConfig = new DocumentBuilder()
		.setTitle('Sauero API')
		.setDescription('Sauero API Documentation')
		.setVersion('1.0')
		.addCookieAuth('better-auth.session_token')
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig);
	if (config.environment !== 'production') {
		SwaggerModule.setup('/api/docs', app, document);
	}

	await app.listen(config.port, config.host);
}

bootstrap().catch((error) => {
	console.error('Failed to start application:', error);
	process.exit(1);
});
