import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
	type OnModuleInit,
} from '@nestjs/common';
import { DATA_PIPELINES, type DataPipelineName } from '@repo/constants';
import { type DataPipeline, PipelineStatus } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';

export const INTERRUPTED_BY_RESTART =
	'Run was interrupted by a server restart before it finished';

@Injectable()
export class DataPipelineService implements OnModuleInit {
	private readonly logger = new Logger(DataPipelineService.name);

	constructor(private readonly prisma: PrismaService) {}

	async onModuleInit() {
		await this.seedPipelines();
		await this.releaseInterruptedRuns();
	}

	private async releaseInterruptedRuns() {
		const { count } = await this.prisma.dataPipeline.updateMany({
			where: { status: PipelineStatus.RUNNING },
			data: {
				status: PipelineStatus.FAILED,
				lastSyncError: INTERRUPTED_BY_RESTART,
			},
		});

		if (count > 0) {
			this.logger.warn(
				`Released ${count} pipeline lock(s) left RUNNING by a previous process`
			);
		}
	}

	private async seedPipelines() {
		for (const pipeline of DATA_PIPELINES) {
			await this.prisma.dataPipeline.upsert({
				where: { name: pipeline.name },
				create: {
					name: pipeline.name,
					source: pipeline.source,
					cadenceType: pipeline.cadenceType,
					cadence: pipeline.cadence,
					description: pipeline.description,
				},
				update: {
					source: pipeline.source,
					cadenceType: pipeline.cadenceType,
					cadence: pipeline.cadence,
					description: pipeline.description,
				},
			});
		}
		await this.pruneUndeclaredPipelines();

		this.logger.log(`Seeded ${DATA_PIPELINES.length} data pipelines`);
	}

	private async pruneUndeclaredPipelines() {
		const declared = DATA_PIPELINES.map((pipeline) => pipeline.name);

		const stale = await this.prisma.dataPipeline.findMany({
			where: { name: { notIn: declared } },
			select: { name: true },
		});
		if (stale.length === 0) return;

		await this.prisma.dataPipeline.deleteMany({
			where: { name: { notIn: declared } },
		});

		this.logger.warn(
			`Removed ${stale.length} undeclared pipeline(s): ${stale
				.map((pipeline) => pipeline.name)
				.join(', ')}`
		);
	}

	async findAll(): Promise<DataPipeline[]> {
		return this.prisma.dataPipeline.findMany({
			orderBy: { name: 'asc' },
		});
	}

	async findByName(name: DataPipelineName): Promise<DataPipeline | null> {
		return this.prisma.dataPipeline.findUnique({
			where: { name },
		});
	}

	async startRun(name: DataPipelineName): Promise<DataPipeline | null> {
		const pipeline = await this.prisma.dataPipeline.findUnique({
			where: { name },
		});

		if (!pipeline) {
			this.logger.warn(`Pipeline "${name}" not found`);
			return null;
		}

		if (pipeline.status === PipelineStatus.PAUSED) {
			this.logger.log(`Pipeline "${name}" is paused, skipping`);
			return null;
		}

		if (pipeline.status === PipelineStatus.RUNNING) {
			this.logger.warn(`Pipeline "${name}" already running, skipping`);
			return null;
		}

		return this.prisma.dataPipeline.update({
			where: { name },
			data: { status: PipelineStatus.RUNNING, lastSyncError: null },
		});
	}

	async markSuccess(name: DataPipelineName, durationMs: number): Promise<void> {
		await this.prisma.dataPipeline.update({
			where: { name },
			data: {
				lastSyncedAt: new Date(),
				status: PipelineStatus.SUCCESS,
				lastSyncError: null,
				lastSyncDurationMs: durationMs,
			},
		});
	}

	async markFailed(name: DataPipelineName, error: string): Promise<void> {
		await this.prisma.dataPipeline.update({
			where: { name },
			data: {
				status: PipelineStatus.FAILED,
				lastSyncError: error,
			},
		});
	}

	async releaseLock(name: DataPipelineName, reason: string): Promise<void> {
		await this.prisma.dataPipeline.update({
			where: { name },
			data: {
				status: PipelineStatus.FAILED,
				lastSyncError: reason,
			},
		});
	}

	async setPaused(
		name: DataPipelineName,
		isPaused: boolean
	): Promise<DataPipeline> {
		const pipeline = await this.prisma.dataPipeline.findUnique({
			where: { name },
		});

		if (!pipeline) {
			throw new NotFoundException(`Pipeline "${name}" not found`);
		}

		if (isPaused && pipeline.status === PipelineStatus.RUNNING) {
			throw new BadRequestException(
				`Pipeline "${name}" is mid-run — wait for it to finish before pausing`
			);
		}

		const status = isPaused
			? PipelineStatus.PAUSED
			: this.priorOutcome(pipeline);

		const updated = await this.prisma.dataPipeline.update({
			where: { name },
			data: { status },
		});

		this.logger.log(`Pipeline "${name}" ${isPaused ? 'paused' : 'resumed'}`);
		return updated;
	}

	private priorOutcome(pipeline: DataPipeline): PipelineStatus | null {
		if (pipeline.lastSyncError) return PipelineStatus.FAILED;
		if (pipeline.lastSyncedAt) return PipelineStatus.SUCCESS;
		return null;
	}

	async updateLastSyncedAt(name: DataPipelineName): Promise<void> {
		await this.prisma.dataPipeline.update({
			where: { name },
			data: { lastSyncedAt: new Date() },
		});
	}
}
