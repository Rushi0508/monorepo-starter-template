import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	DEFAULT_FORECAST_METHOD,
	DEFAULT_FORECAST_WINDOW_MONTHS,
} from '@repo/constants';
import { ForecastMethodType } from '@repo/db';
import { ForecastMethodTypeEnum } from '@repo/enums';
import type { DemandForecastMethodType } from '@repo/types';
import { enumToText } from '@repo/utils';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import type { SetForecastMethodDto } from '../dto/forecast-method.dto';
import { assertPlanEditable } from '../helpers/plan-lock';
import { DemandPlanAuditService } from './demand-plan-audit.service';

const seriesKey = (channel: string, skuSettingId: string) =>
	`${channel}|${skuSettingId}`;

@Injectable()
export class DemandForecastMethodService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly audit: DemandPlanAuditService
	) {}

	async list(planId: string): Promise<DemandForecastMethodType[]> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id: planId },
			include: { channelScopes: { orderBy: { channel: 'asc' } } },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');

		const rows = await this.prisma.demandForecastMethod.findMany({
			where: { planId },
		});
		const bySeries = new Map(
			rows.map((row) => [seriesKey(row.channel, row.skuSettingId), row])
		);

		// A row is seeded for every series when the plan is created, so the
		// fallback below only covers a scope that grew since.
		return plan.channelScopes.flatMap((scope) =>
			scope.skuSettingIds.map((skuSettingId) => {
				const row = bySeries.get(seriesKey(scope.channel, skuSettingId));

				return {
					channel: scope.channel,
					skuSettingId,
					method: row
						? (row.method as ForecastMethodTypeEnum)
						: DEFAULT_FORECAST_METHOD,
					growthPct: row?.growthPct ?? null,
					windowMonths: row?.windowMonths ?? DEFAULT_FORECAST_WINDOW_MONTHS,
				};
			})
		);
	}

	async set(
		planId: string,
		dto: SetForecastMethodDto,
		session: UserSession
	): Promise<DemandForecastMethodType> {
		await this.assertEditable(planId, dto.channel, dto.skuSettingId);

		// Each method reads one parameter; storing the other would leave a value
		// that silently never applies.
		const growthPct =
			dto.method === ForecastMethodType.STATIC_GROWTH
				? (dto.growthPct ?? null)
				: null;
		const windowMonths =
			dto.method === ForecastMethodType.HISTORICAL_AVERAGE
				? (dto.windowMonths ?? DEFAULT_FORECAST_WINDOW_MONTHS)
				: null;

		const row = await this.prisma.demandForecastMethod.upsert({
			where: {
				planId_channel_skuSettingId: {
					planId,
					channel: dto.channel,
					skuSettingId: dto.skuSettingId,
				},
			},
			create: {
				planId,
				channel: dto.channel,
				skuSettingId: dto.skuSettingId,
				method: dto.method,
				growthPct,
				windowMonths,
			},
			update: { method: dto.method, growthPct, windowMonths },
		});

		const detail =
			growthPct !== null
				? ` at ${Math.round(growthPct * 1000) / 10}% a month`
				: windowMonths !== null
					? ` over ${windowMonths} months`
					: '';

		await this.audit.record(
			planId,
			`set ${await this.audit.skuLabel(dto.skuSettingId)} in ${dto.channel} to ${enumToText(dto.method)}${detail}`,
			session
		);

		return {
			channel: row.channel,
			skuSettingId: row.skuSettingId,
			method: row.method as ForecastMethodTypeEnum,
			growthPct: row.growthPct,
			windowMonths: row.windowMonths,
		};
	}

	private async assertEditable(
		planId: string,
		channel: string,
		skuSettingId: string
	) {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id: planId },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');

		assertPlanEditable(plan);

		const inScope = plan.channelScopes.some(
			(scope) =>
				scope.channel === channel && scope.skuSettingIds.includes(skuSettingId)
		);
		if (!inScope) {
			throw new BadRequestException(
				'That SKU is not in scope for this channel'
			);
		}

		return plan;
	}
}
