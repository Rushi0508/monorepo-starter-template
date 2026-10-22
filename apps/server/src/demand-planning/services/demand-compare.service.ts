import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import type { ChannelEnum } from '@repo/enums';
import type {
	DemandComparisonRowType,
	DemandComparisonType,
} from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { periodRange } from '../helpers/period';
import { DemandGridService, type GridCell } from './demand-grid.service';

const seriesKey = (channel: string, skuSettingId: string) =>
	`${channel}|${skuSettingId}`;

@Injectable()
export class DemandComparisonService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly grid: DemandGridService
	) {}

	async compare(
		planAId: string,
		planBId: string
	): Promise<DemandComparisonType> {
		if (planAId === planBId) {
			throw new BadRequestException('Pick two different plans to compare.');
		}

		const plans = await this.prisma.demandPlan.findMany({
			where: { id: { in: [planAId, planBId] } },
			include: { channelScopes: true },
		});
		const planA = plans.find((plan) => plan.id === planAId);
		const planB = plans.find((plan) => plan.id === planBId);
		if (!planA || !planB) throw new NotFoundException('Demand plan not found');

		const start =
			planA.planMonth > planB.planMonth ? planA.planMonth : planB.planMonth;
		const end =
			planA.horizonEnd < planB.horizonEnd ? planA.horizonEnd : planB.horizonEnd;
		const periods = start <= end ? periodRange(start, end) : [];

		const grids = await this.grid.getGridsFor([planAId, planBId]);
		const inWindow = new Set(periods);
		const index = (cells: GridCell[]) => {
			const map = new Map<string, GridCell>();
			for (const cell of cells) {
				if (!inWindow.has(cell.period)) continue;
				map.set(
					`${seriesKey(cell.channel, cell.skuSettingId)}|${cell.period}`,
					cell
				);
			}
			return map;
		};
		const cellsA = index(grids.get(planAId) ?? []);
		const cellsB = index(grids.get(planBId) ?? []);

		const scopeOf = (plan: (typeof plans)[number]) =>
			new Set(
				plan.channelScopes.flatMap((scope) =>
					scope.skuSettingIds.map((skuSettingId) =>
						seriesKey(scope.channel, skuSettingId)
					)
				)
			);
		const scopeA = scopeOf(planA);
		const scopeB = scopeOf(planB);
		const allSeries = [...new Set([...scopeA, ...scopeB])];

		const rows: DemandComparisonRowType[] = [];
		let added = 0;
		let dropped = 0;

		for (const key of allSeries) {
			const inA = scopeA.has(key);
			const inB = scopeB.has(key);
			if (!inA) added += 1;
			if (!inB) dropped += 1;

			const [channel, skuSettingId] = key.split('|') as [string, string];

			for (const period of periods) {
				const before = cellsA.get(`${key}|${period}`);
				const after = cellsB.get(`${key}|${period}`);

				const unitsA = before?.planUnits ?? 0;
				const unitsB = after?.planUnits ?? 0;
				const revenueA = before?.projectedRevenue ?? 0;
				const revenueB = after?.projectedRevenue ?? 0;

				const comparable = inA && inB;
				const volumeEffect = comparable
					? (unitsB - unitsA) * (before?.pricePerUnit ?? 0)
					: 0;
				const scopeEffect = comparable ? 0 : revenueB - revenueA;

				rows.push({
					channel: channel as ChannelEnum,
					skuSettingId,
					period,
					unitsA,
					unitsB,
					revenueA,
					revenueB,
					volumeEffect,
					priceEffect: revenueB - revenueA - volumeEffect - scopeEffect,
					scopeEffect,
				});
			}
		}

		const summary = (plan: (typeof plans)[number]) => ({
			id: plan.id,
			name: plan.name,
			kind: plan.kind,
			status: plan.status,
			planMonth: plan.planMonth,
			horizonEnd: plan.horizonEnd,
		});

		return {
			planA: summary(planA),
			planB: summary(planB),
			periods,
			rows,
			scopeDiff: { added, dropped },
		};
	}
}
