import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MbReplenishmentService } from './mb-replenishment.service';

@Injectable()
export class MbReplenishmentScheduler {
	private readonly logger = new Logger(MbReplenishmentScheduler.name);

	constructor(private readonly replenishmentService: MbReplenishmentService) {}

	@Cron(CronExpression.EVERY_30_MINUTES)
	async checkFulfillment(): Promise<void> {
		try {
			await this.replenishmentService.checkFulfillment();
			this.logger.log('MB replenishment fulfillment check completed');
		} catch (err) {
			this.logger.error('MB replenishment fulfillment check failed', err);
		}
	}
}
