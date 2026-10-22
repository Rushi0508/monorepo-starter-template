import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { config } from './common/env-config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bodyParser: false,
		bufferLogs: true,
	});

	app.useLogger(app.get(Logger));

	app.enableCors({
		origin: config.urls.cors,
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			exceptionFactory: (errors) =>
				new BadRequestException({
					message: 'Something went wrong',
					data: errors,
				}),
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: false,
			},
		})
	);

	app.useGlobalFilters(new GlobalExceptionFilter());
	app.setGlobalPrefix('api');

	if (config.environment !== 'production') {
		const swaggerConfig = new DocumentBuilder()
			.setTitle('Starter API')
			.setDescription('Starter API documentation')
			.setVersion('1.0')
			.addCookieAuth('better-auth.session_token')
			.build();
		const document = SwaggerModule.createDocument(app, swaggerConfig);
		SwaggerModule.setup('/api/docs', app, document);
	}

	await app.listen(config.port, config.host);
}

bootstrap().catch((error) => {
	console.error('Failed to start application:', error);
	process.exit(1);
});
