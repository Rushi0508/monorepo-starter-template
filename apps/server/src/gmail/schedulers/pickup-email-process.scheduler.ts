import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PickupEmailProcessService } from '../services/pickup-email-process.service';

@Injectable()
export class PickupEmailProcessScheduler {
	private readonly logger = new Logger(PickupEmailProcessScheduler.name);
	private running = false;

	constructor(private readonly processService: PickupEmailProcessService) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async processQueue(): Promise<void> {
		if (this.running) {
			this.logger.debug('Pickup process still running; skip tick');
			return;
		}

		this.running = true;
		try {
			const { processed, id } = await this.processService.processNextPending();
			if (!id) return;

			if (processed) {
				this.logger.log(
					`Pickup process scheduler completed pickup email ${id}`
				);
			} else {
				this.logger.warn(
					`Pickup process scheduler left pickup email ${id} unprocessed`
				);
			}
		} catch (err) {
			this.logger.error('Pickup process scheduler failed', err);
		} finally {
			this.running = false;
		}
	}
}
