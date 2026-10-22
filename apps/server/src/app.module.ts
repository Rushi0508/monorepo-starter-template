import { Module, RequestMethod } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulerGuardService } from './common/scheduler-guard.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrainingVideosModule } from './training-videos/training-videos.module';
import { UsersModule } from './users/users.module';
@Module({
	imports: [
		EventEmitterModule.forRoot(),
		ScheduleModule.forRoot(),
		LoggerModule.forRoot({
			forRoutes: [{ method: RequestMethod.ALL, path: '*splat' }],
			pinoHttp: {
				transport: {
					targets: [
						{
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
					],
				},
				redact: ['req.headers', 'res.headers'],
				level: 'debug',
			},
		}),
		PrismaModule,
		UsersModule,
		TrainingVideosModule,
	],
	controllers: [AppController],
	providers: [AppService, SchedulerGuardService],
})
export class AppModule {}
