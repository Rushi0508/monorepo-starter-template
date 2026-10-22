import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PodEmailProcessService } from '../services/pod-email-process.service';

@Injectable()
export class PodEmailProcessScheduler {
	private readonly logger = new Logger(PodEmailProcessScheduler.name);
	private running = false;

	constructor(private readonly processService: PodEmailProcessService) {}

	@Cron(CronExpression.EVERY_MINUTE)
	async processQueue(): Promise<void> {
		if (this.running) {
			this.logger.debug('POD process still running; skip tick');
			return;
		}

		this.running = true;
		try {
			const { processed, id } = await this.processService.processNextPending();
			if (!id) return;

			if (processed) {
				this.logger.log(`POD process scheduler completed POD email ${id}`);
			} else {
				this.logger.warn(
					`POD process scheduler left POD email ${id} unprocessed`
				);
			}
		} catch (err) {
			this.logger.error('POD process scheduler failed', err);
		} finally {
			this.running = false;
		}
	}
}
