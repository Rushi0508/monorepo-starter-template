import { Injectable, Logger } from '@nestjs/common';
import { FolkMappingStatus } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient, type FolkPastInteraction } from '../folk.client';

export type FolkInteractionsSyncResult = {
	considered: number;
	updated: number;
	failed: number;
};

function latestContact(
	interactions: FolkPastInteraction[]
): { at: Date; type: string | null } | null {
	let latest: { at: Date; type: string | null } | null = null;

	for (const interaction of interactions) {
		if (!interaction.dateTime) continue;
		const at = new Date(interaction.dateTime);
		if (Number.isNaN(at.getTime())) continue;
		if (!latest || at > latest.at) {
			latest = { at, type: interaction.activityType ?? null };
		}
	}

	return latest;
}

@Injectable()
export class FolkInteractionsService {
	private readonly logger = new Logger(FolkInteractionsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient
	) {}

	async syncMappedCompanies(): Promise<FolkInteractionsSyncResult> {
		const mappings = await this.prisma.folkCompanyMapping.findMany({
			where: {
				status: FolkMappingStatus.MAPPED,
				customers: { some: {} },
			},
			select: { id: true, folkCompanyId: true },
		});

		let updated = 0;
		let failed = 0;

		for (const mapping of mappings) {
			try {
				await this.syncLastContact(mapping.id, mapping.folkCompanyId);
				updated += 1;
			} catch (err) {
				failed += 1;
				this.logger.warn(
					`Folk interactions sync failed for ${mapping.folkCompanyId}: ${(err as Error).message}`
				);
			}
		}

		this.logger.log(
			`Folk interactions sync — considered ${mappings.length}, updated ${updated}, failed ${failed}`
		);

		return { considered: mappings.length, updated, failed };
	}

	/** Stamps a mapping with its company's most recent Folk interaction. */
	async syncLastContact(
		mappingId: string,
		folkCompanyId: string
	): Promise<void> {
		const interactions =
			await this.folkClient.listPastInteractions(folkCompanyId);
		const latest = latestContact(interactions);

		await this.prisma.folkCompanyMapping.update({
			where: { id: mappingId },
			data: {
				lastContactAt: latest?.at ?? null,
				lastContactType: latest?.type ?? null,
			},
		});
	}
}
