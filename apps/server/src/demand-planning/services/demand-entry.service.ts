import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import type { DemandGridCellType } from '@repo/types';
import { overrideDeviation } from '@repo/utils';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import type { SetDemandEntryDto } from '../dto/demand-entry.dto';
import { currentPeriod } from '../helpers/period';
import { assertPlanEditable } from '../helpers/plan-lock';
import { DemandGridService } from './demand-grid.service';
import { DemandPlanAuditService } from './demand-plan-audit.service';

/**
 * A typed cell of the grid.
 *
 * Nothing about the forecast is stored — an entry is the difference between
 * what the method produced and what the business committed to, so clearing one
 * restores the statistical value rather than blanking the cell.
 */
@Injectable()
export class DemandEntryService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly grid: DemandGridService,
		private readonly audit: DemandPlanAuditService
	) {}

	async set(
		planId: string,
		dto: SetDemandEntryDto,
		session: UserSession
	): Promise<DemandGridCellType> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id: planId },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');

		assertPlanEditable(plan);

		const inScope = plan.channelScopes.some(
			(scope) =>
				scope.channel === dto.channel &&
				scope.skuSettingIds.includes(dto.skuSettingId)
		);
		if (!inScope) {
			throw new BadRequestException(
				'That SKU is not in scope for this channel'
			);
		}

		// Closed months are history and the horizon is the plan's own window.
		const firstEditable =
			plan.planMonth > currentPeriod() ? plan.planMonth : currentPeriod();
		if (dto.period < firstEditable || dto.period > plan.horizonEnd) {
			throw new BadRequestException(
				'That month is outside the editable horizon'
			);
		}

		const where = {
			planId_channel_skuSettingId_period: {
				planId,
				channel: dto.channel,
				skuSettingId: dto.skuSettingId,
				period: dto.period,
			},
		};

		if (dto.units === null) {
			await this.prisma.demandPlanEntry.deleteMany({
				where: {
					planId,
					channel: dto.channel,
					skuSettingId: dto.skuSettingId,
					period: dto.period,
				},
			});
			await this.audit.record(
				planId,
				`restored the forecast for ${await this.audit.skuLabel(dto.skuSettingId)} in ${dto.channel}, ${dto.period}`,
				session
			);
			return this.cell(planId, dto);
		}

		// The reason threshold is measured against the statistical value the cell
		// is departing from, so it has to be read before the entry is written.
		const before = await this.cell(planId, dto);
		const deviation =
			before.statisticalUnits === null
				? null
				: overrideDeviation(dto.units, before.statisticalUnits);

		if (
			deviation !== null &&
			deviation > plan.requireReasonAbovePct &&
			!dto.reason
		) {
			throw new BadRequestException(
				`A change this far from the forecast needs a reason (over ${Math.round(plan.requireReasonAbovePct * 100)}%)`
			);
		}

		await this.prisma.demandPlanEntry.upsert({
			where,
			create: {
				planId,
				channel: dto.channel,
				skuSettingId: dto.skuSettingId,
				period: dto.period,
				units: dto.units,
				reason: dto.reason,
				note: dto.note,
				createdById: session.user.id,
			},
			update: { units: dto.units, reason: dto.reason, note: dto.note },
		});

		await this.audit.record(
			planId,
			`set ${await this.audit.skuLabel(dto.skuSettingId)} in ${dto.channel}, ${dto.period} to ${dto.units} cases`,
			session
		);

		return this.cell(planId, dto);
	}

	private async cell(
		planId: string,
		dto: Pick<SetDemandEntryDto, 'channel' | 'skuSettingId' | 'period'>
	): Promise<DemandGridCellType> {
		const cells = await this.grid.getGrid(planId);
		const found = cells.find(
			(c) =>
				c.channel === dto.channel &&
				c.skuSettingId === dto.skuSettingId &&
				c.period === dto.period
		);
		if (!found) throw new NotFoundException('That cell is not in the grid');

		return {
			actualUnits: found.actualUnits,
			actualRevenue: found.actualRevenue,
			isPartialActual: found.isPartialActual,
			statisticalUnits: found.statisticalUnits,
			planUnits: found.planUnits,
			isOverride: found.isOverride,
			isFlagged: found.isFlagged,
			overrideReason: found.overrideReason,
			overrideNote: found.overrideNote,
			pricePerUnit: found.pricePerUnit,
			cogsPerUnit: found.cogsPerUnit,
			fulfillmentCostPerUnit: found.fulfillmentCostPerUnit,
			projectedRevenue: found.projectedRevenue,
			isEditable: found.isEditable,
		};
	}
}
