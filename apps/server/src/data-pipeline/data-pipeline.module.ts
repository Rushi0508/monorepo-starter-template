import { Global, Module } from '@nestjs/common';
import { BlueBoxModule } from 'src/bluebox/bluebox.module';
import { DemandPlanningModule } from 'src/demand-planning/demand-planning.module';
import { FolkModule } from 'src/folk/folk.module';
import { GmailModule } from 'src/gmail/gmail.module';
import { QboModule } from 'src/qbo/qbo.module';
import { ShopifyModule } from 'src/shopify/shopify.module';
import { SimplyDepoModule } from 'src/simplydepo/simplydepo.module';
import { DataPipelineController } from './data-pipeline.controller';
import { DataPipelineRunnerService, DataPipelineService } from './services';

@Global()
@Module({
	imports: [
		ShopifyModule,
		BlueBoxModule,
		QboModule,
		SimplyDepoModule,
		DemandPlanningModule,
		FolkModule,
		GmailModule,
	],
	controllers: [DataPipelineController],
	providers: [DataPipelineService, DataPipelineRunnerService],
	exports: [DataPipelineService],
})
export class DataPipelineModule {}
