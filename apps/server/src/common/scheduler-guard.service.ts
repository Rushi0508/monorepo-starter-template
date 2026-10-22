import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { config } from './env-config';

/**
 * Stops every registered cron job in development.
 *
 * Several schedulers write to live external systems -- MB replenishment sets
 * inventory quantities in Shopify every 30 minutes, QBO sync writes into real
 * accounting -- so running them from a developer machine against production
 * credentials causes real-world side effects.
 *
 * Guarding centrally rather than in each scheduler means a newly added @Cron is
 * covered automatically, instead of shipping unguarded because someone forgot.
 */
@Injectable()
export class SchedulerGuardService implements OnApplicationBootstrap {
	private readonly logger = new Logger(SchedulerGuardService.name);

	constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

	// Runs once every module has registered its jobs. OnModuleInit would be too
	// early to see crons belonging to modules initialised after this one.
	onApplicationBootstrap(): void {
		const isDevelopment = config.environment === 'development';
		if (!isDevelopment) return;

		const jobs = this.schedulerRegistry.getCronJobs();
		for (const [name, job] of jobs) {
			job.stop();
			this.logger.debug(`Stopped scheduler: ${name}`);
		}

		this.logger.log(`Skipping ${jobs.size} scheduler(s) in development mode`);
	}
}
