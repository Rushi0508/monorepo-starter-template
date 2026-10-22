import { createHash } from 'node:crypto';
import {
	Injectable,
	Logger,
	ServiceUnavailableException,
	UnauthorizedException,
} from '@nestjs/common';
import { FolkMappingStatus } from '@repo/db';
import { config } from 'src/common/env-config';
import { DataPipelineService } from 'src/data-pipeline/services/data-pipeline.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient } from '../folk.client';
import { verifyFolkWebhookSignature } from '../folk-webhook-signature';
import { FOLK_FIELDS, isSaueroOwnedField } from '../utils/folk-fields';
import { FolkGroupsService } from './folk-groups.service';
import { FolkMappingService } from './folk-mapping.service';
import { FolkSeedService } from './folk-seed.service';

const FOLK_WEBHOOKS_PIPELINE = 'folk-webhooks-realtime' as const;

type FolkWebhookChange = {
	path: string[];
	type: 'add' | 'remove' | 'set';
	value?: unknown;
};

type FolkWebhookPayload = {
	id: string;
	type: string;
	data: {
		id: string;
		changes?: FolkWebhookChange[];
	};
};

@Injectable()
export class FolkWebhookService {
	private readonly logger = new Logger(FolkWebhookService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient,
		private readonly seedService: FolkSeedService,
		private readonly mappingService: FolkMappingService,
		private readonly pipelineService: DataPipelineService,
		private readonly groupsService: FolkGroupsService
	) {}

	verifyOrThrow(headers: {
		webhookId?: string;
		webhookTimestamp?: string;
		webhookSignature?: string;
		rawBody?: Buffer;
	}): void {
		if (!config.folk.webhookSecret) {
			throw new ServiceUnavailableException(
				'Folk webhooks are not configured. Set FOLK_WEBHOOK_SECRET.'
			);
		}
		if (
			!headers.rawBody ||
			!headers.webhookId ||
			!headers.webhookTimestamp ||
			!headers.webhookSignature
		) {
			throw new UnauthorizedException('Missing Folk webhook signature headers');
		}

		const check = verifyFolkWebhookSignature({
			rawBody: headers.rawBody,
			webhookId: headers.webhookId,
			webhookTimestamp: headers.webhookTimestamp,
			webhookSignature: headers.webhookSignature,
			secret: config.folk.webhookSecret,
		});

		if (!check.valid) {
			const secret = config.folk.webhookSecret;
			const fingerprint = secret
				? createHash('sha256').update(secret).digest('hex').slice(0, 12)
				: '(empty)';
			this.logger.warn(
				`Folk webhook rejected (${check.reason}) — secret fp ${fingerprint} len ${secret.length}` +
					(check.expected
						? ` — expected ${check.expected}, received ${headers.webhookSignature}`
						: '')
			);
			throw new UnauthorizedException(
				`Invalid Folk webhook signature (${check.reason})`
			);
		}
	}

	async ingest(payload: {
		id: string;
		type: string;
		data: { id: string; changes?: FolkWebhookChange[] };
	}): Promise<void> {
		const startedAt = Date.now();
		try {
			await this.process(payload);
			await this.pipelineService.markSuccess(
				FOLK_WEBHOOKS_PIPELINE,
				Date.now() - startedAt
			);
		} catch (err) {
			this.logger.error(
				`Folk webhook ${payload.id} (${payload.type}) failed: ${(err as Error).message}`,
				(err as Error).stack
			);
			await this.pipelineService
				.markFailed(FOLK_WEBHOOKS_PIPELINE, (err as Error).message)
				.catch(() => undefined);
			throw err;
		}
	}

	private async process(payload: FolkWebhookPayload): Promise<void> {
		switch (payload.type) {
			case 'company.created':
				await this.seedService.upsertCompanyFromWebhook(payload.data.id);
				return;
			case 'company.updated':
				await this.handleUpdated(payload);
				return;
			case 'company.deleted':
				await this.seedService.removeMapping(payload.data.id);
				return;
			case 'company.groups_updated':
				await this.handleGroupsUpdated(payload);
				return;
			default:
				this.logger.debug(`Ignoring Folk event type ${payload.type}`);
		}
	}

	private async handleUpdated(payload: FolkWebhookPayload): Promise<void> {
		const changes = payload.data.changes ?? [];
		if (
			changes.length > 0 &&
			changes.every((change) => this.isEchoChange(change))
		) {
			this.logger.debug(`Ignoring Sauero echo for ${payload.data.id}`);
			return;
		}

		const mapping = await this.prisma.folkCompanyMapping.findUnique({
			where: { folkCompanyId: payload.data.id },
		});

		await this.seedService.upsertCompanyFromWebhook(payload.data.id);

		if (!mapping || mapping.status !== FolkMappingStatus.MAPPED) {
			return;
		}

		const statusChange = this.findCustomFieldChange(
			changes,
			mapping.folkGroupId,
			FOLK_FIELDS.status
		);
		const accountTypeChange = this.findCustomFieldChange(
			changes,
			mapping.folkGroupId,
			FOLK_FIELDS.accountType
		);
		if (!statusChange && !accountTypeChange) return;

		const company = await this.folkClient.getCompany(payload.data.id);
		await this.mappingService.applyRelationshipFields(
			mapping.id,
			company,
			mapping.folkGroupId
		);
	}

	private async handleGroupsUpdated(
		payload: FolkWebhookPayload
	): Promise<void> {
		const inScope = await this.groupsService.getTrackedGroupIds();
		const removed = (payload.data.changes ?? []).some(
			(change) =>
				change.path[0] === 'groups' &&
				change.type === 'remove' &&
				this.changeMentionsAnyGroup(change.value, inScope)
		);
		const added = (payload.data.changes ?? []).some(
			(change) =>
				change.path[0] === 'groups' &&
				change.type === 'add' &&
				this.changeMentionsAnyGroup(change.value, inScope)
		);

		if (removed && !added) {
			await this.seedService.removeMapping(payload.data.id);
			return;
		}
		if (added) {
			await this.seedService.upsertCompanyFromWebhook(payload.data.id);
		}
	}

	private isEchoChange(change: FolkWebhookChange): boolean {
		if (change.path[0] !== 'customFieldValues') return false;
		const fieldName = change.path[2];
		return typeof fieldName === 'string' && isSaueroOwnedField(fieldName);
	}

	private findCustomFieldChange(
		changes: FolkWebhookChange[],
		groupId: string,
		fieldName: string
	): FolkWebhookChange | undefined {
		return changes.find(
			(change) =>
				change.path[0] === 'customFieldValues' &&
				change.path[1] === groupId &&
				change.path[2] === fieldName
		);
	}

	private changeMentionsAnyGroup(value: unknown, groupIds: string[]): boolean {
		if (!Array.isArray(value)) return false;
		return value.some(
			(item) =>
				typeof item === 'object' &&
				item !== null &&
				'id' in item &&
				groupIds.includes((item as { id: string }).id)
		);
	}
}
