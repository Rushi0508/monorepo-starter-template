import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DemandOverrideReason } from '@repo/db';
import type { DemandImportResultType } from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { parseWorkbookToRows } from 'src/common/utils/parse-file.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import { currentPeriod, periodRange } from '../helpers/period';
import { assertPlanEditable } from '../helpers/plan-lock';

export const IMPORT_CHANNEL_HEADER = 'Channel';
export const IMPORT_SKU_HEADER = 'SKU';

const MONTHS = [
	'jan',
	'feb',
	'mar',
	'apr',
	'may',
	'jun',
	'jul',
	'aug',
	'sep',
	'oct',
	'nov',
	'dec',
];

/** Accepts "Sep 2026", "September 2026" and "2026-09". */
function toPeriod(header: string): string | null {
	const value = header.trim();

	const iso = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
	if (iso) return value;

	const named = /^([A-Za-z]{3,})\s+(\d{4})$/.exec(value);
	if (!named) return null;

	const index = MONTHS.indexOf(named[1]!.slice(0, 3).toLowerCase());
	if (index < 0) return null;
	return `${named[2]}-${String(index + 1).padStart(2, '0')}`;
}

@Injectable()
export class DemandImportService {
	private readonly logger = new Logger(DemandImportService.name);

	constructor(private readonly prisma: PrismaService) {}

	async import(
		planId: string,
		file: { buffer: Buffer; originalname?: string },
		session: UserSession
	): Promise<DemandImportResultType> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id: planId },
			include: { channelScopes: true },
		});
		if (!plan) throw new BadRequestException('Demand plan not found');
		assertPlanEditable(plan);

		const catalog = await loadSkuCatalog(this.prisma);

		const inScope = new Set(
			plan.channelScopes.flatMap((scope) =>
				scope.skuSettingIds.map((skuId) => `${scope.channel}|${skuId}`)
			)
		);

		// A closed month cannot be planned, so the window starts at whichever of
		// the plan month and the current month comes later.
		const now = currentPeriod();
		const firstEditable = plan.planMonth > now ? plan.planMonth : now;
		const editable = new Set(periodRange(firstEditable, plan.horizonEnd));

		const rows = parseWorkbookToRows(file.buffer, this.logger);
		const headers = Object.keys(rows[0] ?? {}).map((h) => h.trim());

		for (const required of [IMPORT_CHANNEL_HEADER, IMPORT_SKU_HEADER]) {
			if (!headers.includes(required)) {
				throw new BadRequestException(
					`Missing the "${required}" column. Download the template for this plan to get the right columns.`
				);
			}
		}

		const monthColumns = headers
			.map((header) => ({ header, period: toPeriod(header) }))
			.filter((column): column is { header: string; period: string } =>
				Boolean(column.period)
			);
		if (monthColumns.length === 0) {
			throw new BadRequestException(
				'No month columns found. Each month needs its own column, for example "Sep 2026".'
			);
		}

		const errors: string[] = [];
		const entries: {
			planId: string;
			channel: string;
			skuSettingId: string;
			period: string;
			units: number;
		}[] = [];
		const seen = new Set<string>();

		let rowNumber = 1;
		for (const row of rows) {
			rowNumber++;

			const channel = String(row[IMPORT_CHANNEL_HEADER] ?? '').trim();
			const skuCode = String(row[IMPORT_SKU_HEADER] ?? '').trim();
			if (!channel && !skuCode) continue;

			const skuSettingId = catalog.resolve(skuCode)?.id;
			if (!skuSettingId) {
				errors.push(`Row ${rowNumber}: unknown SKU "${skuCode}".`);
				continue;
			}
			if (!inScope.has(`${channel}|${skuSettingId}`)) {
				errors.push(
					`Row ${rowNumber}: ${skuCode} is not in this plan's scope for ${channel || '(no channel)'}.`
				);
				continue;
			}

			for (const column of monthColumns) {
				const raw = row[column.header];
				if (raw === null || raw === undefined || String(raw).trim() === '') {
					continue;
				}
				if (!editable.has(column.period)) continue;

				const units = Number(String(raw).replaceAll(',', '').trim());
				if (!Number.isFinite(units) || units < 0) {
					errors.push(
						`Row ${rowNumber}, ${column.header}: "${raw}" is not a number of cases.`
					);
					continue;
				}

				const key = `${channel}|${skuSettingId}|${column.period}`;
				if (seen.has(key)) {
					errors.push(
						`Row ${rowNumber}: ${skuCode} in ${channel} appears more than once for ${column.header}.`
					);
					continue;
				}
				seen.add(key);
				entries.push({
					planId,
					channel,
					skuSettingId,
					period: column.period,
					units: Math.round(units),
				});
			}
		}

		if (errors.length > 0) {
			throw new BadRequestException(
				`${errors.length} problem${errors.length === 1 ? '' : 's'} in the file. Nothing was imported.\n${errors.slice(0, 20).join('\n')}`
			);
		}
		if (entries.length === 0) {
			throw new BadRequestException(
				'No values to import. Every month cell was blank or outside this plan’s forecast window.'
			);
		}

		const note = `Imported from ${file.originalname ?? 'a file'}`;

		await this.prisma.$transaction(async (tx) => {
			for (const entry of entries) {
				await tx.demandPlanEntry.upsert({
					where: {
						planId_channel_skuSettingId_period: {
							planId: entry.planId,
							channel: entry.channel,
							skuSettingId: entry.skuSettingId,
							period: entry.period,
						},
					},
					create: {
						...entry,
						reason: DemandOverrideReason.MANUAL_ADJUSTMENT,
						note,
						createdById: session.user.id,
					},
					update: {
						units: entry.units,
						reason: DemandOverrideReason.MANUAL_ADJUSTMENT,
						note,
					},
				});
			}

			await tx.demandPlanAudit.create({
				data: {
					planId,
					activity: `${session.user.name} imported ${entries.length} cells from ${file.originalname ?? 'a file'}`,
					userId: session.user.id,
				},
			});
		});

		return {
			cells: entries.length,
			series: new Set(entries.map((e) => `${e.channel}|${e.skuSettingId}`))
				.size,
			periods: [...new Set(entries.map((e) => e.period))].sort(),
		};
	}
}
