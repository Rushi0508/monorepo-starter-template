import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import type {
	GetSkuAuditLogsResponseType,
	SkuAuditLogMetadata,
} from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Repeated edits to the same field by the same user inside this window collapse
 * into one row. Settings autosave every 500ms mid-edit, so typing "100" really
 * does write 1, then 10, then 100 — three genuine diffs that should read as one.
 */
const COALESCE_WINDOW_MS = 10 * 1000;

export type SkuFieldChange = {
	skuSettingId: string;
	sku: string;
	title: string | null;
	columnId: string;
	columnName: string;
	oldValue: string;
	newValue: string;
};

type Tx = Prisma.TransactionClient;

export const formatValue = (value: string): string => {
	const trimmed = value.trim();
	if (trimmed === '') return '(empty)';
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
	return `"${trimmed}"`;
};

export const formatSkuLabel = (sku: string, title?: string | null): string =>
	title?.trim() ? `${sku} (${title.trim()})` : sku;

@Injectable()
export class SkuAuditLogService {
	constructor(private readonly prisma: PrismaService) {}

	// ── Writes ─────────────────────────────────────────────────────────────────

	/** Callers must have diffed against the DB — every change here is real. */
	async recordFieldChanges(
		tx: Tx,
		session: UserSession,
		changes: SkuFieldChange[]
	): Promise<void> {
		for (const change of changes) {
			await this.recordFieldChange(tx, session, change);
		}
	}

	private async recordFieldChange(
		tx: Tx,
		session: UserSession,
		change: SkuFieldChange
	): Promise<void> {
		const recent = await tx.skuSettingsAuditLog.findFirst({
			where: {
				userId: session.user.id,
				skuSettingId: change.skuSettingId,
				columnId: change.columnId,
				updatedAt: { gte: new Date(Date.now() - COALESCE_WINDOW_MS) },
			},
			orderBy: { updatedAt: 'desc' },
		});

		if (!recent) {
			await tx.skuSettingsAuditLog.create({
				data: {
					activity: this.fieldActivity(
						session.user.name,
						change,
						change.oldValue,
						change.newValue
					),
					userId: session.user.id,
					skuSettingId: change.skuSettingId,
					columnId: change.columnId,
					metadata: {
						sku: change.sku,
						columnName: change.columnName,
						oldValue: change.oldValue,
						newValue: change.newValue,
					},
				},
			});
			return;
		}

		const metadata = (recent.metadata ?? {}) as Record<string, unknown>;
		const originalOld =
			typeof metadata.oldValue === 'string' ? metadata.oldValue : '';

		// Edited back to where it started — nothing actually happened.
		if (originalOld.trim() === change.newValue.trim()) {
			await tx.skuSettingsAuditLog.delete({ where: { id: recent.id } });
			return;
		}

		await tx.skuSettingsAuditLog.update({
			where: { id: recent.id },
			data: {
				activity: this.fieldActivity(
					session.user.name,
					change,
					originalOld,
					change.newValue
				),
				metadata: {
					...metadata,
					columnName: change.columnName,
					newValue: change.newValue,
				} as Prisma.InputJsonValue,
			},
		});
	}

	/** Discrete events — no coalescing, each one is its own line. */
	async recordEvent(
		session: UserSession,
		activity: string,
		opts: {
			skuSettingId?: string | null;
			columnId?: string | null;
			metadata?: Prisma.InputJsonValue;
		} = {}
	): Promise<void> {
		await this.prisma.skuSettingsAuditLog.create({
			data: {
				activity,
				userId: session.user.id,
				skuSettingId: opts.skuSettingId ?? null,
				columnId: opts.columnId ?? null,
				metadata: opts.metadata,
			},
		});
	}

	private fieldActivity(
		actorName: string,
		change: SkuFieldChange,
		oldValue: string,
		newValue: string
	): string {
		const label = formatSkuLabel(change.sku, change.title);
		return `${actorName} updated ${label} — ${change.columnName}: ${formatValue(oldValue)} → ${formatValue(newValue)}`;
	}

	// ── Reads ──────────────────────────────────────────────────────────────────

	async getAuditLogs(): Promise<GetSkuAuditLogsResponseType> {
		const where: Prisma.SkuSettingsAuditLogWhereInput = {};

		const [totalCount, rows] = await Promise.all([
			this.prisma.skuSettingsAuditLog.count({ where }),
			this.prisma.skuSettingsAuditLog.findMany({
				where,
				include: { user: { select: { id: true, name: true } } },
				orderBy: { updatedAt: 'desc' },
			}),
		]);

		return {
			data: rows.map((row) => ({
				...row,
				metadata: row.metadata as SkuAuditLogMetadata,
			})),
			totalCount,
		};
	}
}
