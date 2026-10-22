import { Module, RequestMethod } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlueBoxModule } from './bluebox/bluebox.module';
import { SchedulerGuardService } from './common/scheduler-guard.service';
import { ConfigurationModule } from './configuration/configuration.module';
import { CustomerModule } from './customers/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DataPipelineModule } from './data-pipeline/data-pipeline.module';
import { DemandPlanningModule } from './demand-planning/demand-planning.module';
import { FolkModule } from './folk/folk.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { GmailModule } from './gmail/gmail.module';
import { InventoryModule } from './inventory/inventory.module';
import { LlmModule } from './llm/llm.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { QboModule } from './qbo/qbo.module';
import { RevenueModule } from './revenue/revenue.module';
import { ShopifyModule } from './shopify/shopify.module';
import { SimplyDepoModule } from './simplydepo/simplydepo.module';
import { SkillsModule } from './skills/skills.module';
import { SkuModule } from './sku/sku.module';
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
		ShopifyModule,
		BlueBoxModule,
		ConfigurationModule,
		QboModule,
		DataPipelineModule,
		CustomerModule,
		DashboardModule,
		FulfillmentModule,
		GmailModule,
		InventoryModule,
		LlmModule,
		OrdersModule,
		RevenueModule,
		SkuModule,
		DemandPlanningModule,
		FolkModule,
		SimplyDepoModule,
		SkillsModule,
		TrainingVideosModule,
	],
	controllers: [AppController],
	providers: [AppService, SchedulerGuardService],
})
export class AppModule {}
