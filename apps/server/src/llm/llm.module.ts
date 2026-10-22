import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { PickupOcrService } from './services/pickup-ocr.service';
import { PodLineMapperService } from './services/pod-line-mapper.service';
import { PodOcrService } from './services/pod-ocr.service';
import { ReplenishmentAckClassifierService } from './services/replenishment-ack-classifier.service';

@Module({
	controllers: [LlmController],
	providers: [
		PodOcrService,
		PodLineMapperService,
		PickupOcrService,
		ReplenishmentAckClassifierService,
	],
	exports: [
		PodOcrService,
		PodLineMapperService,
		PickupOcrService,
		ReplenishmentAckClassifierService,
	],
})
export class LlmModule {}
