import { Injectable, Logger } from '@nestjs/common';
import type { FolkFieldPreflightResultType } from '@repo/types';
import { FolkApiClient } from '../folk.client';
import { FOLK_FIELD_OWNERS, type FolkFieldType } from '../utils/folk-fields';
import { FolkGroupsService } from './folk-groups.service';

@Injectable()
export class FolkPreflightService {
	private readonly logger = new Logger(FolkPreflightService.name);

	constructor(
		private readonly folkClient: FolkApiClient,
		private readonly groupsService: FolkGroupsService
	) {}

	async run(): Promise<FolkFieldPreflightResultType> {
		const trackedGroups = await this.groupsService.listTracked();
		const groups: FolkFieldPreflightResultType['groups'] = [];

		for (const { folkGroupId: groupId, name } of trackedGroups) {
			const existing = await this.folkClient.listGroupCustomFields(
				groupId,
				'company'
			);
			const byName = new Map(
				existing.map((field) => [field.name, field] as const)
			);

			const created: string[] = [];
			const mismatches: {
				name: string;
				expected: string;
				actual: string;
			}[] = [];
			const missingReadOnly: string[] = [];

			for (const definition of Object.values(FOLK_FIELD_OWNERS)) {
				const found = byName.get(definition.name);
				if (!found) {
					if (definition.owner === 'sauero' && definition.enabled !== false) {
						await this.createField(groupId, definition.name, definition.type);
						created.push(definition.name);
					} else if (definition.owner === 'folk') {
						missingReadOnly.push(definition.name);
					}
					continue;
				}
				if (found.type !== definition.type) {
					mismatches.push({
						name: definition.name,
						expected: definition.type,
						actual: found.type,
					});
				}
			}

			groups.push({
				groupId,
				label: name,
				created,
				mismatches,
				missingReadOnly,
			});

			this.logger.log(
				`Folk preflight group ${groupId}: created=${created.length}, mismatches=${mismatches.length}, missingReadOnly=${missingReadOnly.length}`
			);
		}

		return { groups };
	}

	private async createField(
		groupId: string,
		name: string,
		type: FolkFieldType
	): Promise<void> {
		const extras =
			type === 'singleSelect'
				? {
						options: [
							{ label: 'Yes', color: '#20cea9' },
							{ label: 'No', color: '#879aab' },
						],
					}
				: type === 'numericField'
					? { config: { format: 'number', decimals: 2 } }
					: {};

		await this.folkClient.createGroupCustomField(groupId, 'company', {
			name,
			type,
			...extras,
		});
	}
}
