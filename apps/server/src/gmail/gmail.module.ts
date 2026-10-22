import { Module } from '@nestjs/common';
import { LlmModule } from 'src/llm/llm.module';
import { SimplyDepoModule } from 'src/simplydepo/simplydepo.module';
import { GmailEventsConsumer } from './consumers/gmail-events.consumer';
import { GmailController } from './gmail.controller';
import { GmailMessageHandler } from './handlers/gmail-message.handler';
import { GmailInboxScheduler } from './schedulers/gmail-inbox.scheduler';
import { PickupEmailProcessScheduler } from './schedulers/pickup-email-process.scheduler';
import { PodEmailProcessScheduler } from './schedulers/pod-email-process.scheduler';
import { DeliveryRequestEmailService } from './services/delivery-request-email.service';
import { GmailService } from './services/gmail.service';
import { GmailInboxService } from './services/gmail-inbox.service';
import { InboundEmailService } from './services/inbound-email.service';
import { PickupEmailProcessService } from './services/pickup-email-process.service';
import { PickupRequestEmailService } from './services/pickup-request-email.service';
import { PodEmailProcessService } from './services/pod-email-process.service';

@Module({
	imports: [LlmModule, SimplyDepoModule],
	controllers: [GmailController],
	providers: [
		GmailService,
		GmailInboxService,
		GmailMessageHandler,
		GmailEventsConsumer,
		GmailInboxScheduler,
		InboundEmailService,
		PodEmailProcessScheduler,
		PodEmailProcessService,
		PickupEmailProcessScheduler,
		PickupEmailProcessService,
		PickupRequestEmailService,
		DeliveryRequestEmailService,
	],
	exports: [
		GmailService,
		GmailInboxService,
		PodEmailProcessService,
		DeliveryRequestEmailService,
		PickupRequestEmailService,
		GmailInboxScheduler,
	],
})
export class GmailModule {}
