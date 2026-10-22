import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
	FolkGroupType,
	SetFolkTrackedGroupsResultType,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient } from '../folk.client';

@Injectable()
export class FolkGroupsService {
	private readonly logger = new Logger(FolkGroupsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient
	) {}

	async getTrackedGroupIds(): Promise<string[]> {
		const groups = await this.prisma.folkTrackedGroup.findMany({
			select: { folkGroupId: true },
		});
		return groups.map((group) => group.folkGroupId);
	}

	/** Tracked groups with the name last mirrored from Folk. */
	listTracked(): Promise<{ folkGroupId: string; name: string }[]> {
		return this.prisma.folkTrackedGroup.findMany({
			select: { folkGroupId: true, name: true },
			orderBy: { name: 'asc' },
		});
	}

	/** Every group in the Folk workspace, flagged with whether Sauero tracks it. */
	async list(): Promise<FolkGroupType[]> {
		const [groups, trackedIds] = await Promise.all([
			this.folkClient.listGroups(),
			this.getTrackedGroupIds(),
		]);
		const tracked = new Set(trackedIds);

		return groups.map((group) => ({
			folkGroupId: group.id,
			// Folk allows unnamed groups; fall back to the id so the picker is usable.
			name: group.name?.trim() || group.id,
			tracked: tracked.has(group.id),
		}));
	}

	/**
	 * Replaces the tracked set. Dropping a group deletes its mappings, since the
	 * seed only refreshes tracked groups and would otherwise leave them stale
	 * forever. Linked customers are unlinked by the FK, not deleted.
	 */
	async setTracked(
		folkGroupIds: string[]
	): Promise<SetFolkTrackedGroupsResultType> {
		const groups = await this.list();
		const nameByGroupId = new Map(
			groups.map((group) => [group.folkGroupId, group.name])
		);

		const unknown = folkGroupIds.filter((id) => !nameByGroupId.has(id));
		if (unknown.length > 0) {
			throw new NotFoundException(
				`Folk group(s) not found in the workspace: ${unknown.join(', ')}`
			);
		}

		const removed = groups
			.filter(
				(group) => group.tracked && !folkGroupIds.includes(group.folkGroupId)
			)
			.map((group) => group.folkGroupId);

		let removedMappings = 0;
		if (removed.length > 0) {
			const { count } = await this.prisma.folkCompanyMapping.deleteMany({
				where: { folkGroupId: { in: removed } },
			});
			removedMappings = count;
			await this.prisma.folkTrackedGroup.deleteMany({
				where: { folkGroupId: { in: removed } },
			});
		}

		await this.upsertTracked(folkGroupIds, nameByGroupId);

		this.logger.log(
			`Folk tracked groups set to ${folkGroupIds.length} group(s) — ` +
				`untracked ${removed.length}, removed ${removedMappings} mapping(s)`
		);

		return {
			groups: groups.map((group) => ({
				...group,
				name: nameByGroupId.get(group.folkGroupId) ?? group.name,
				tracked: folkGroupIds.includes(group.folkGroupId),
			})),
			removedMappings,
		};
	}

	/** Mirrors Folk's current group names onto the tracked rows. */
	async syncNames(): Promise<void> {
		const groups = await this.list();
		const tracked = groups.filter((group) => group.tracked);
		if (tracked.length === 0) return;

		await this.upsertTracked(
			tracked.map((group) => group.folkGroupId),
			new Map(tracked.map((group) => [group.folkGroupId, group.name]))
		);
	}

	private async upsertTracked(
		folkGroupIds: string[],
		nameByGroupId: Map<string, string>
	): Promise<void> {
		for (const folkGroupId of folkGroupIds) {
			const name = nameByGroupId.get(folkGroupId) ?? folkGroupId;
			await this.prisma.folkTrackedGroup.upsert({
				where: { folkGroupId },
				create: { folkGroupId, name },
				update: { name },
			});
		}
	}
}
