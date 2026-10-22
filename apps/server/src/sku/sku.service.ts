import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@repo/db';
import type {
	GetSkuSettingsResponseType,
	SkuChannelPresence,
	SkuCheckResult,
	SkuOptionsFilterType,
	SkuOptionType,
} from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	CreateSkuColumnDto,
	UpdateSkuColumnDto,
} from './dto/create-sku-column.dto';
import {
	CreateSkuSettingDto,
	UpdateSkuSettingDto,
} from './dto/create-sku-setting.dto';
import { ReorderSkuColumnsDto } from './dto/reorder-sku-columns.dto';
import { UpdateSkuSettingsDto } from './dto/update-sku-settings.dto';
import {
	formatSkuLabel,
	formatValue,
	SkuAuditLogService,
	type SkuFieldChange,
} from './sku-audit-log.service';
import { skuKey } from './sku-catalog';

const emptyChannels = (): SkuChannelPresence => ({
	shopify: false,
	bluebox: false,
	simplydepo: false,
});

const toSkuSet = (rows: { sku: string | null }[]): Set<string> =>
	new Set(
		rows
			.map((r) => r.sku?.trim().toLowerCase())
			.filter((s): s is string => Boolean(s))
	);

const asFields = (value: Prisma.JsonValue | null): Record<string, string> =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, string>)
		: {};

/** One canonical shape, so whitespace-only edits diff to "no change". */
const normalizeFields = (
	fields: Record<string, string>
): Record<string, string> => {
	const next: Record<string, string> = {};
	for (const [key, value] of Object.entries(fields)) {
		const trimmed = (value ?? '').trim();
		if (trimmed !== '') next[key] = trimmed;
	}
	return next;
};

@Injectable()
export class SkuService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly auditLog: SkuAuditLogService
	) {}

	// ── Options (for filters / forms) ──────────────────────────────────────────

	/**
	 * SKU settings is the canonical catalog, so the option list comes straight
	 * from it. Sourcing from Shopify variants instead hid any SKU that had not
	 * yet been sold or synced — a freshly added SKU never showed up in the
	 * production run / replenishment pickers.
	 */
	async getSkuOptions(
		filter: SkuOptionsFilterType = {}
	): Promise<SkuOptionType[]> {
		const [settings, columns] = await Promise.all([
			this.prisma.skuSetting.findMany({
				select: {
					id: true,
					sku: true,
					title: true,
					customFields: true,
					aliases: { select: { sku: true } },
				},
				orderBy: { sku: 'asc' },
			}),
			// Custom columns are keyed by id in customFields, so "Unit Type" and
			// "Master Status" have to be looked up by name. Matched loosely because
			// they are user-created columns whose casing is not guaranteed.
			this.prisma.skuColumn.findMany({
				where: {
					OR: [
						{ name: { equals: 'unit type', mode: 'insensitive' } },
						{ name: { equals: 'master status', mode: 'insensitive' } },
					],
				},
				select: { id: true, name: true },
			}),
		]);

		const columnId = (name: string) =>
			columns.find((c) => c.name.trim().toLowerCase() === name)?.id;
		const unitTypeColumnId = columnId('unit type');
		const statusColumnId = columnId('master status');

		const fieldsOf = (s: (typeof settings)[number]) =>
			(s.customFields ?? {}) as Record<string, unknown>;

		let filtered = settings;

		if (filter.status === 'active' && statusColumnId) {
			filtered = filtered.filter((s) => {
				const status = fieldsOf(s)[statusColumnId];
				return typeof status === 'string' && skuKey(status) === 'active';
			});
		}

		if (filter.connectedTo) {
			const codes = filtered.flatMap((s) => [
				s.sku,
				...s.aliases.map((a) => a.sku),
			]);
			const rows =
				filter.connectedTo === 'shopify'
					? await this.prisma.shopifyProductVariant.findMany({
							where: {
								sku: { in: codes, mode: 'insensitive' },
								product: { status: { equals: 'active', mode: 'insensitive' } },
							},
							select: { sku: true },
							distinct: ['sku'],
						})
					: await this.prisma.blueboxInventory.findMany({
							where: { sku: { in: codes, mode: 'insensitive' } },
							select: { sku: true },
							distinct: ['sku'],
						});
			const connected = toSkuSet(rows);
			filtered = filtered.filter((s) =>
				[s.sku, ...s.aliases.map((a) => a.sku)].some((code) =>
					connected.has(skuKey(code))
				)
			);
		}

		return filtered.map((s) => {
			const unitType = unitTypeColumnId ? fieldsOf(s)[unitTypeColumnId] : null;

			return {
				id: s.id,
				sku: s.sku,
				title: s.title?.trim() || s.sku,
				unitType:
					typeof unitType === 'string' && unitType.trim() ? unitType : null,
			};
		});
	}

	// ── SKU Settings ───────────────────────────────────────────────────────────

	async getSkuSettings(): Promise<GetSkuSettingsResponseType> {
		const [settings, columns] = await Promise.all([
			this.prisma.skuSetting.findMany({ orderBy: { sku: 'asc' } }),
			this.prisma.skuColumn.findMany({ orderBy: { position: 'asc' } }),
		]);

		const skus = settings.map((s) => s.sku);
		if (skus.length === 0) {
			return {
				data: settings.map((s) => ({ ...s, channels: emptyChannels() })),
				columns,
			};
		}

		const [shopifyRows, blueboxRows, simplydepoRows] = await Promise.all([
			this.prisma.shopifyProductVariant.findMany({
				where: { sku: { in: skus, mode: 'insensitive' } },
				select: { sku: true },
				distinct: ['sku'],
			}),
			this.prisma.blueboxInventory.findMany({
				where: { sku: { in: skus, mode: 'insensitive' } },
				select: { sku: true },
				distinct: ['sku'],
			}),
			this.prisma.simplyDepoProduct.findMany({
				where: { sku: { in: skus, mode: 'insensitive' } },
				select: { sku: true },
				distinct: ['sku'],
			}),
		]);

		const shopify = toSkuSet(shopifyRows);
		const bluebox = toSkuSet(blueboxRows);
		const simplydepo = toSkuSet(simplydepoRows);

		return {
			data: settings.map((s) => {
				const key = s.sku.toLowerCase();
				return {
					...s,
					channels: {
						shopify: shopify.has(key),
						bluebox: bluebox.has(key),
						simplydepo: simplydepo.has(key),
					},
				};
			}),
			columns,
		};
	}

	async checkSku(sku: string, ownerId?: string): Promise<SkuCheckResult> {
		const normalized = sku.trim();

		const [shopify, bluebox, simplydepo, conflict] = await Promise.all([
			this.prisma.shopifyProductVariant.findFirst({
				where: { sku: { equals: normalized, mode: 'insensitive' } },
				select: { sku: true },
			}),
			this.prisma.blueboxInventory.findFirst({
				where: { sku: { equals: normalized, mode: 'insensitive' } },
				select: { sku: true },
			}),
			this.prisma.simplyDepoProduct.findFirst({
				where: { sku: { equals: normalized, mode: 'insensitive' } },
				select: { sku: true },
			}),
			this.findSkuCodeConflict(normalized, ownerId),
		]);

		return {
			existsInShopify: !!shopify,
			existsInBluebox: !!bluebox,
			existsInSimplyDepo: !!simplydepo,
			existsInSettings: !!conflict,
		};
	}

	async createSkuSetting(dto: CreateSkuSettingDto, session: UserSession) {
		const sku = dto.sku;

		await this.assertSkuCodeAvailable(sku);

		const created = await this.prisma.skuSetting.create({
			data: {
				sku,
				title: dto.title ?? null,
				customFields: {},
			},
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} added SKU ${formatSkuLabel(sku, dto.title)}`,
			{ skuSettingId: created.id, metadata: { sku, title: dto.title ?? null } }
		);

		return { message: `SKU "${sku}" added successfully` };
	}

	async updateSkuSetting(
		id: string,
		dto: UpdateSkuSettingDto,
		session: UserSession
	) {
		const existing = await this.prisma.skuSetting.findUnique({
			where: { id },
		});
		if (!existing) {
			throw new NotFoundException(`SKU setting not found`);
		}

		const renamed = dto.sku !== undefined && dto.sku !== existing.sku;
		if (renamed && dto.sku) {
			await this.assertSkuCodeAvailable(dto.sku, id);
		}

		const updated = await this.prisma.$transaction(async (tx) => {
			if (renamed && dto.sku) {
				await this.recordRename(tx, id, existing.sku, dto.sku);
			}
			return tx.skuSetting.update({
				where: { id },
				data: { ...dto },
			});
		});

		const label = formatSkuLabel(existing.sku, existing.title);
		if (renamed) {
			await this.auditLog.recordEvent(
				session,
				`${session.user.name} renamed SKU ${existing.sku} to ${dto.sku}`,
				{
					skuSettingId: id,
					metadata: { oldValue: existing.sku, newValue: dto.sku },
				}
			);
		}
		if (dto.title !== undefined && dto.title !== existing.title) {
			await this.auditLog.recordEvent(
				session,
				`${session.user.name} updated ${label} — Title: ${formatValue(existing.title ?? '')} → ${formatValue(dto.title ?? '')}`,
				{
					skuSettingId: id,
					metadata: {
						sku: existing.sku,
						columnName: 'Title',
						oldValue: existing.title ?? '',
						newValue: dto.title ?? '',
					},
				}
			);
		}

		return updated;
	}

	/**
	 * A code can belong to only one SKU, including codes a SKU used to go by —
	 * reusing one would attach the old orders to the wrong product. `ownerId`
	 * lets a SKU rename back to one of its own old codes.
	 */
	private async findSkuCodeConflict(
		sku: string,
		ownerId?: string
	): Promise<string | null> {
		const [setting, alias] = await Promise.all([
			this.prisma.skuSetting.findFirst({
				where: {
					sku: { equals: sku.trim(), mode: 'insensitive' },
					...(ownerId ? { id: { not: ownerId } } : {}),
				},
				select: { sku: true },
			}),
			this.prisma.skuAlias.findFirst({
				where: { sku: { equals: sku.trim(), mode: 'insensitive' } },
				select: { skuSettingId: true, skuSetting: { select: { sku: true } } },
			}),
		]);

		if (setting) return `SKU "${setting.sku}" already exists`;
		if (alias && alias.skuSettingId !== ownerId) {
			return `"${sku}" is a previous code of SKU "${alias.skuSetting.sku}" and cannot be reused`;
		}
		return null;
	}

	private async assertSkuCodeAvailable(sku: string, ownerId?: string) {
		const conflict = await this.findSkuCodeConflict(sku, ownerId);
		if (conflict) throw new ConflictException(conflict);
	}

	private async recordRename(
		tx: Prisma.TransactionClient,
		id: string,
		from: string,
		to: string
	) {
		await tx.skuAlias.deleteMany({
			where: {
				skuSettingId: id,
				sku: { in: [from, to], mode: 'insensitive' },
			},
		});
		if (skuKey(from) !== skuKey(to)) {
			await tx.skuAlias.create({ data: { skuSettingId: id, sku: from } });
		}
	}

	async deleteSkuSetting(id: string, session: UserSession) {
		const existing = await this.prisma.skuSetting.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundException(`SKU setting not found`);
		}

		await this.prisma.skuSetting.delete({ where: { id } });

		// skuSettingId stays null — the row is gone, the activity line survives.
		await this.auditLog.recordEvent(
			session,
			`${session.user.name} deleted SKU ${formatSkuLabel(existing.sku, existing.title)}`,
			{ metadata: { sku: existing.sku, title: existing.title } }
		);

		return { message: `SKU setting deleted` };
	}

	/**
	 * Autosave sends every visible row on every tick, so most payloads contain no
	 * actual change. Diffing against the DB keeps the audit log honest and drops
	 * the write from N rows to only the dirty ones.
	 */
	async updateSkuSettings(dto: UpdateSkuSettingsDto, session: UserSession) {
		const skus = dto.updates.map((u) => u.sku);
		if (skus.length === 0) return { message: 'SKU settings updated' };

		const [existing, columns] = await Promise.all([
			this.prisma.skuSetting.findMany({
				where: { sku: { in: skus } },
				select: { id: true, sku: true, title: true, customFields: true },
			}),
			this.prisma.skuColumn.findMany({ select: { id: true, name: true } }),
		]);

		const bySku = new Map(existing.map((s) => [s.sku, s]));
		const columnNames = new Map(columns.map((c) => [c.id, c.name]));

		const changes: SkuFieldChange[] = [];
		const dirty: { id: string; customFields: Record<string, string> }[] = [];

		for (const update of dto.updates) {
			const row = bySku.get(update.sku);
			if (!row) continue;

			const oldFields = asFields(row.customFields);
			const nextFields = normalizeFields(update.customFields);
			const columnIds = new Set([
				...Object.keys(oldFields),
				...Object.keys(nextFields),
			]);

			const rowChanges: SkuFieldChange[] = [];
			for (const columnId of columnIds) {
				const oldValue = (oldFields[columnId] ?? '').trim();
				const newValue = nextFields[columnId] ?? '';
				if (oldValue === newValue) continue;

				rowChanges.push({
					skuSettingId: row.id,
					sku: row.sku,
					title: row.title,
					columnId,
					columnName: columnNames.get(columnId) ?? 'Unknown column',
					oldValue,
					newValue,
				});
			}

			if (rowChanges.length === 0) continue;
			changes.push(...rowChanges);
			dirty.push({ id: row.id, customFields: nextFields });
		}

		if (dirty.length === 0) return { message: 'SKU settings updated' };

		await this.prisma.$transaction(async (tx) => {
			for (const row of dirty) {
				await tx.skuSetting.update({
					where: { id: row.id },
					data: { customFields: row.customFields as Prisma.InputJsonValue },
				});
			}
			await this.auditLog.recordFieldChanges(tx, session, changes);
		});

		return { message: 'SKU settings updated' };
	}

	// ── Dynamic Columns ────────────────────────────────────────────────────────

	async createColumn(dto: CreateSkuColumnDto, session: UserSession) {
		const max = await this.prisma.skuColumn.aggregate({
			_max: { position: true },
		});
		const position = (max._max.position ?? -1) + 1;

		const column = await this.prisma.skuColumn.create({
			data: { name: dto.name, position },
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} added column "${column.name}"`,
			{ columnId: column.id, metadata: { columnName: column.name } }
		);

		return column;
	}

	async updateColumn(
		id: string,
		dto: UpdateSkuColumnDto,
		session: UserSession
	) {
		const existing = await this.prisma.skuColumn.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundException(`Column "${id}" not found`);
		}

		const column = await this.prisma.skuColumn.update({
			where: { id },
			data: {
				name: dto.name,
			},
		});

		if (column.name !== existing.name) {
			await this.auditLog.recordEvent(
				session,
				`${session.user.name} renamed column "${existing.name}" to "${column.name}"`,
				{
					columnId: id,
					metadata: { oldValue: existing.name, newValue: column.name },
				}
			);
		}

		return column;
	}

	async reorderColumns(
		reorderColumnsDto: ReorderSkuColumnsDto,
		session: UserSession
	) {
		const orderedIds = reorderColumnsDto.orderedIds;
		const existing = await this.prisma.skuColumn.findMany({
			select: { id: true },
		});
		const existingIds = new Set(existing.map((c) => c.id));

		if (
			orderedIds.length !== existingIds.size ||
			orderedIds.some((id) => !existingIds.has(id))
		) {
			throw new NotFoundException(
				'Column list does not match existing columns'
			);
		}

		await this.prisma.$transaction(
			orderedIds.map((id, position) =>
				this.prisma.skuColumn.update({
					where: { id },
					data: { position },
				})
			)
		);

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} reordered columns`
		);

		return { message: 'Columns reordered' };
	}

	async deleteColumn(id: string, session: UserSession) {
		const existing = await this.prisma.skuColumn.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundException(`Column "${id}" not found`);
		}

		const settings = await this.prisma.skuSetting.findMany({
			select: { id: true, customFields: true },
		});

		await this.prisma.$transaction([
			...settings.map((s) => {
				const fields =
					s.customFields &&
					typeof s.customFields === 'object' &&
					!Array.isArray(s.customFields)
						? { ...(s.customFields as Record<string, string>) }
						: {};
				delete fields[id];
				return this.prisma.skuSetting.update({
					where: { id: s.id },
					data: { customFields: fields as Prisma.InputJsonValue },
				});
			}),
			this.prisma.skuColumn.delete({ where: { id } }),
		]);

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} deleted column "${existing.name}"`,
			{ metadata: { columnName: existing.name } }
		);

		return { message: `Column "${existing.name}" deleted` };
	}
}
