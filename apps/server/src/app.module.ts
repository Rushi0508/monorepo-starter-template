import { Module, RequestMethod } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './common/auth';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
	imports: [
		LoggerModule.forRoot({
			forRoutes: [{ method: RequestMethod.ALL, path: '*splat' }],
			pinoHttp: {
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
						singleLine: false,
						translateTime: 'yyyy-mm-dd HH:MM:ss.l',
						hideObject: true,
						ignore: 'pid,hostname',
						messageFormat:
							'[{req.id}] {req.method} {req.url} - {msg}  {res.statusCode} {responseTime}',
					},
				},
				redact: ['req.headers', 'res.headers'],
				level: 'debug',
			},
		}),
		AuthModule.forRoot({ auth }),
		PrismaModule,
		UsersModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
