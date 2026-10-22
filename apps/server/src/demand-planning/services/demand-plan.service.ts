import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	DEFAULT_FORECAST_METHOD,
	DEFAULT_FORECAST_WINDOW_MONTHS,
} from '@repo/constants';
import {
	DemandPlanKind,
	DemandPlanStatus,
	ForecastMethodType,
	type Prisma,
} from '@repo/db';
import type {
	DemandPlanAuditType,
	DemandPlanListItemType,
	DemandPlanType,
} from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
	CreateDemandPlanDto,
	FinalizeDemandPlanDto,
	UpdateDemandPlanDto,
} from '../dto/demand-plan.dto';
import { freezeBaselineFor } from '../helpers/baseline';
import { addMonths, currentPeriod, monthsBetween } from '../helpers/period';
import { assertCycleFree, assertNoOpenDraft } from '../helpers/plan-guards';
import { assertPlanEditable } from '../helpers/plan-lock';
import { DemandGridService } from './demand-grid.service';

const monthName = (period: string): string => {
	const [year, month] = period.split('-').map(Number);
	return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, 1)).toLocaleString(
		'en-US',
		{ month: 'long', year: 'numeric', timeZone: 'UTC' }
	);
};

@Injectable()
export class DemandPlanService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly grid: DemandGridService
	) {}

	async getOperativePlan(): Promise<DemandPlanType | null> {
		const draft = await this.prisma.demandPlan.findFirst({
			where: { kind: DemandPlanKind.BASE, status: DemandPlanStatus.DRAFT },
			orderBy: { createdAt: 'desc' },
			include: { channelScopes: { orderBy: { channel: 'asc' } } },
		});
		if (draft) return draft;

		return this.prisma.demandPlan.findFirst({
			where: { kind: DemandPlanKind.BASE, status: DemandPlanStatus.FINAL },
			orderBy: { finalizedAt: 'desc' },
			include: { channelScopes: { orderBy: { channel: 'asc' } } },
		});
	}

	async getPlan(id: string): Promise<DemandPlanType> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id },
			include: { channelScopes: { orderBy: { channel: 'asc' } } },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');
		return plan;
	}

	async getAudits(planId: string): Promise<DemandPlanAuditType[]> {
		return this.prisma.demandPlanAudit.findMany({
			where: { planId },
			orderBy: { createdAt: 'desc' },
		});
	}

	async listPlans(): Promise<DemandPlanListItemType[]> {
		const plans = await this.prisma.demandPlan.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				createdBy: { select: { name: true } },
				finalizedBy: { select: { name: true } },
			},
		});

		const overrides = await this.prisma.demandPlanEntry.groupBy({
			by: ['planId'],
			_count: { _all: true },
		});
		const overrideByPlan = new Map(
			overrides.map((o) => [o.planId, o._count._all])
		);

		// One batch of queries for every plan, rather than one batch each: the
		// list used to get slower with every plan ever created.
		const grids = await this.grid.getGridsFor(plans.map((plan) => plan.id));

		return Promise.all(
			plans.map(async ({ createdBy, finalizedBy, ...plan }) => {
				const cells = grids.get(plan.id) ?? [];

				return {
					...plan,
					totalCases: cells.reduce((sum, c) => sum + (c.planUnits ?? 0), 0),
					totalRevenue:
						Math.round(
							cells.reduce((sum, c) => sum + (c.projectedRevenue ?? 0), 0) * 100
						) / 100,
					overrideCount: overrideByPlan.get(plan.id) ?? 0,
					createdBy: createdBy?.name ?? null,
					finalizedBy: finalizedBy?.name ?? null,
				};
			})
		);
	}

	/**
	 * Only a draft can be edited: Forecast Accuracy scores a finalized plan
	 * against actuals, so moving its horizon or scope would rewrite history.
	 */
	async update(
		id: string,
		dto: UpdateDemandPlanDto,
		session: UserSession
	): Promise<DemandPlanType> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');

		assertPlanEditable(plan);

		if (dto.horizonEnd !== undefined && dto.horizonEnd < plan.planMonth) {
			throw new BadRequestException(
				'The horizon must end on or after the plan month'
			);
		}

		const changes: string[] = [];
		if (dto.name !== undefined && dto.name !== plan.name) {
			changes.push(`renamed the plan to "${dto.name}"`);
		}
		if (dto.horizonEnd !== undefined && dto.horizonEnd !== plan.horizonEnd) {
			changes.push(`moved the horizon end to ${dto.horizonEnd}`);
		}
		if (dto.notes !== undefined && dto.notes !== plan.notes) {
			changes.push('updated the notes');
		}
		if (dto.scope && this.scopeChanged(plan.channelScopes, dto.scope)) {
			changes.push('changed the plan scope');
		}

		const flagPct = dto.flagOverrideAbovePct ?? plan.flagOverrideAbovePct;
		const reasonPct = dto.requireReasonAbovePct ?? plan.requireReasonAbovePct;
		if (reasonPct < flagPct) {
			throw new BadRequestException(
				'The reason threshold must be at or above the flag threshold'
			);
		}

		if (
			dto.flagOverrideAbovePct !== undefined &&
			dto.flagOverrideAbovePct !== plan.flagOverrideAbovePct
		) {
			changes.push(
				`set the flag threshold to ${dto.flagOverrideAbovePct * 100}%`
			);
		}
		if (
			dto.requireReasonAbovePct !== undefined &&
			dto.requireReasonAbovePct !== plan.requireReasonAbovePct
		) {
			changes.push(
				`set the reason threshold to ${dto.requireReasonAbovePct * 100}%`
			);
		}

		return this.prisma.$transaction(async (tx) => {
			const updated = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					...(dto.name !== undefined ? { name: dto.name } : {}),
					...(dto.notes !== undefined ? { notes: dto.notes } : {}),
					...(dto.horizonEnd !== undefined
						? { horizonEnd: dto.horizonEnd }
						: {}),
					...(dto.flagOverrideAbovePct !== undefined
						? { flagOverrideAbovePct: dto.flagOverrideAbovePct }
						: {}),
					...(dto.requireReasonAbovePct !== undefined
						? { requireReasonAbovePct: dto.requireReasonAbovePct }
						: {}),
					...(dto.scope
						? {
								channelScopes: {
									deleteMany: {},
									create: dto.scope.map((entry) => ({
										channel: entry.channel,
										skuSettingIds: entry.skuSettingIds,
									})),
								},
							}
						: {}),
				},
			});

			// A SKU brought into scope now has no ladder in the plan, so its cells
			// would price at nothing. Existing rows are left alone.
			if (dto.scope) {
				const before = new Set(
					plan.channelScopes.flatMap((scope) => scope.skuSettingIds)
				);
				const added = [
					...new Set(dto.scope.flatMap((entry) => entry.skuSettingIds)),
				].filter((skuId) => !before.has(skuId));
				if (added.length > 0) await this.copyPricing(tx, id, added);
				await this.seedForecastMethods(tx, id, dto.scope);
			}

			if (changes.length > 0) {
				await tx.demandPlanAudit.create({
					data: {
						planId: id,
						activity: `${session.user.name} ${changes.join(', ')}`,
						userId: session.user.id,
					},
				});
			}

			return updated;
		});
	}

	async finalize(
		id: string,
		dto: FinalizeDemandPlanDto,
		session: UserSession
	): Promise<DemandPlanType> {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');

		if (plan.status === DemandPlanStatus.FINAL) {
			throw new ConflictException('This plan is already finalized.');
		}
		if (plan.kind !== DemandPlanKind.BASE) {
			throw new BadRequestException(
				'Scenarios are saved rather than finalized.'
			);
		}

		if (plan.channelScopes.every((scope) => scope.skuSettingIds.length === 0)) {
			throw new BadRequestException(
				'This plan covers no SKUs, so there is nothing to finalize.'
			);
		}

		const baseline = await freezeBaselineFor(this.prisma, plan);
		const frozenMonths = new Set(baseline.map((actual) => actual.period)).size;

		return this.prisma.$transaction(async (tx) => {
			if (baseline.length > 0) {
				await tx.demandPlanBaselineActual.createMany({
					data: baseline.map((actual) => ({
						planId: id,
						channel: actual.channel,
						skuSettingId: actual.skuSettingId,
						period: actual.period,
						units: actual.units,
						grossRevenue: actual.grossRevenue,
						netRevenue: actual.netRevenue,
					})),
					skipDuplicates: true,
				});
			}

			const updated = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					status: DemandPlanStatus.FINAL,
					finalizedAt: new Date(),
					finalizedById: session.user.id,
					...(dto.notes !== undefined ? { notes: dto.notes } : {}),
				},
			});

			await tx.demandPlanAudit.create({
				data: {
					planId: id,
					activity: `${session.user.name} finalized the plan, freezing ${frozenMonths} months of actuals as its baseline`,
					userId: session.user.id,
				},
			});

			return updated;
		});
	}

	/**
	 * Returns a finalized plan to draft.
	 *
	 * The frozen baseline goes with it: a draft projects from live actuals, so
	 * leaving the old rows behind would let a later finalize silently keep a
	 * snapshot of actuals as they stood the first time round.
	 */
	async unlock(id: string, session: UserSession): Promise<DemandPlanType> {
		const plan = await this.prisma.demandPlan.findUnique({ where: { id } });
		if (!plan) throw new NotFoundException('Demand plan not found');

		if (plan.kind !== DemandPlanKind.BASE) {
			throw new BadRequestException('Scenarios are reopened, not unlocked.');
		}
		if (plan.status !== DemandPlanStatus.FINAL) {
			throw new ConflictException('This plan is not finalized.');
		}

		await assertNoOpenDraft(this.prisma);

		return this.prisma.$transaction(async (tx) => {
			const { count } = await tx.demandPlanBaselineActual.deleteMany({
				where: { planId: id },
			});
			const unlocked = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					status: DemandPlanStatus.DRAFT,
					finalizedAt: null,
					finalizedById: null,
				},
			});
			await tx.demandPlanAudit.create({
				data: {
					planId: id,
					activity: `${session.user.name} unlocked the plan, discarding ${count} frozen baseline rows`,
					userId: session.user.id,
				},
			});
			return unlocked;
		});
	}

	/**
	 * Starts the next cycle from this one: same scope, methods and price ladder,
	 * a month further on. The source plan is untouched.
	 */
	async rollForward(id: string, session: UserSession): Promise<DemandPlanType> {
		const source = await this.prisma.demandPlan.findUnique({
			where: { id },
			include: { channelScopes: true },
		});
		if (!source) throw new NotFoundException('Demand plan not found');
		if (source.kind !== DemandPlanKind.BASE) {
			throw new BadRequestException('Only a base plan starts a cycle.');
		}

		await assertNoOpenDraft(this.prisma);

		// The cycle you are actually in, but never the source's own month — two
		// base plans in one month cannot both be scored.
		const nextAfterSource = addMonths(source.planMonth, 1);
		const now = currentPeriod();
		const planMonth = now > nextAfterSource ? now : nextAfterSource;
		await assertCycleFree(this.prisma, planMonth);

		// The plan owns its ladder, so the next cycle inherits that rather than
		// today's SKU settings — which may already have moved on.
		const [methods, entries, cogs, fulfillment, prices] = await Promise.all([
			this.prisma.demandForecastMethod.findMany({ where: { planId: id } }),
			// Only commitments the new cycle can still act on.
			this.prisma.demandPlanEntry.findMany({
				where: { planId: id, period: { gte: planMonth } },
			}),
			this.prisma.demandPlanCogs.findMany({ where: { planId: id } }),
			this.prisma.demandPlanChannelFulfillmentCost.findMany({
				where: { planId: id },
			}),
			this.prisma.demandPlanChannelPrice.findMany({ where: { planId: id } }),
		]);

		return this.prisma.$transaction(async (tx) => {
			const plan = await tx.demandPlan.create({
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					name: `${monthName(planMonth)} demand plan`,
					notes: '',
					planMonth,
					horizonEnd: addMonths(
						source.horizonEnd,
						monthsBetween(source.planMonth, planMonth)
					),
					kind: DemandPlanKind.BASE,
					status: DemandPlanStatus.DRAFT,
					flagOverrideAbovePct: source.flagOverrideAbovePct,
					requireReasonAbovePct: source.requireReasonAbovePct,
					createdById: session.user.id,
					channelScopes: {
						create: source.channelScopes.map((scope) => ({
							channel: scope.channel,
							skuSettingIds: scope.skuSettingIds,
						})),
					},
				},
			});

			if (cogs.length > 0) {
				await tx.demandPlanCogs.createMany({
					data: cogs.map((row) => ({
						planId: plan.id,
						skuSettingId: row.skuSettingId,
						materials: row.materials,
						production: row.production,
						shipping: row.shipping,
						amount: row.amount,
						effectiveFrom: row.effectiveFrom,
						note: row.note,
					})),
				});
			}
			if (fulfillment.length > 0) {
				await tx.demandPlanChannelFulfillmentCost.createMany({
					data: fulfillment.map((row) => ({
						planId: plan.id,
						skuSettingId: row.skuSettingId,
						channel: row.channel,
						storage: row.storage,
						pick: row.pick,
						pack: row.pack,
						shipping: row.shipping,
						amount: row.amount,
						effectiveFrom: row.effectiveFrom,
						note: row.note,
					})),
				});
			}
			if (prices.length > 0) {
				await tx.demandPlanChannelPrice.createMany({
					data: prices.map((row) => ({
						planId: plan.id,
						skuSettingId: row.skuSettingId,
						channel: row.channel,
						amount: row.amount,
						effectiveFrom: row.effectiveFrom,
						note: row.note,
					})),
				});
			}

			if (methods.length > 0) {
				await tx.demandForecastMethod.createMany({
					data: methods.map((method) => ({
						planId: plan.id,
						channel: method.channel,
						skuSettingId: method.skuSettingId,
						method: method.method,
						growthPct: method.growthPct,
						windowMonths: method.windowMonths,
					})),
				});
			}
			if (entries.length > 0) {
				await tx.demandPlanEntry.createMany({
					data: entries.map((entry) => ({
						planId: plan.id,
						channel: entry.channel,
						skuSettingId: entry.skuSettingId,
						period: entry.period,
						units: entry.units,
						reason: entry.reason,
						note: entry.note,
						createdById: session.user.id,
					})),
				});
			}

			await tx.demandPlanAudit.create({
				data: {
					planId: plan.id,
					activity: `${session.user.name} started the cycle from "${source.name}"`,
					userId: session.user.id,
				},
			});

			return plan;
		});
	}

	private scopeChanged(
		current: { channel: string; skuSettingIds: string[] }[],
		next: { channel: string; skuSettingIds: string[] }[]
	): boolean {
		const key = (rows: { channel: string; skuSettingIds: string[] }[]) =>
			rows
				.map(
					(row) => `${row.channel}:${[...row.skuSettingIds].sort().join(',')}`
				)
				.sort()
				.join('|');
		return key(current) !== key(next);
	}

	async remove(id: string): Promise<{ message: string }> {
		const plan = await this.prisma.demandPlan.findUnique({ where: { id } });
		if (!plan) throw new NotFoundException('Demand plan not found');

		await this.prisma.demandPlan.delete({ where: { id } });
		return { message: 'Plan deleted' };
	}

	async create(
		dto: CreateDemandPlanDto,
		session: UserSession
	): Promise<DemandPlanType> {
		await assertNoOpenDraft(this.prisma);

		const planMonth = currentPeriod();
		await assertCycleFree(this.prisma, planMonth);

		if (dto.horizonEnd < planMonth) {
			throw new BadRequestException(
				'The horizon must end on or after the current month'
			);
		}

		const skuSettingIds = [
			...new Set(dto.scope.flatMap((entry) => entry.skuSettingIds)),
		];

		return this.prisma.$transaction(async (tx) => {
			const plan = await tx.demandPlan.create({
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					name: dto.name,
					notes: dto.notes ?? '',
					planMonth,
					horizonEnd: dto.horizonEnd,
					kind: DemandPlanKind.BASE,
					status: DemandPlanStatus.DRAFT,
					createdById: session.user.id,
					channelScopes: {
						create: dto.scope.map((entry) => ({
							channel: entry.channel,
							skuSettingIds: entry.skuSettingIds,
						})),
					},
				},
			});

			await this.copyPricing(tx, plan.id, skuSettingIds);
			await this.seedForecastMethods(tx, plan.id, dto.scope);
			await tx.demandPlanAudit.create({
				data: {
					planId: plan.id,
					activity: `${session.user.name} created the plan`,
					userId: session.user.id,
				},
			});

			return plan;
		});
	}

	private async seedForecastMethods(
		tx: Prisma.TransactionClient,
		planId: string,
		scope: { channel: string; skuSettingIds: string[] }[]
	): Promise<void> {
		const rows = scope.flatMap((entry) =>
			entry.skuSettingIds.map((skuSettingId) => ({
				planId,
				channel: entry.channel,
				skuSettingId,
				method: DEFAULT_FORECAST_METHOD,
				growthPct: null,
				windowMonths:
					DEFAULT_FORECAST_METHOD === ForecastMethodType.HISTORICAL_AVERAGE
						? DEFAULT_FORECAST_WINDOW_MONTHS
						: null,
			}))
		);
		if (rows.length === 0) return;

		await tx.demandForecastMethod.createMany({
			data: rows,
			skipDuplicates: true,
		});
	}

	/**
	 * A plan owns its pricing outright, so a later SKU settings edit cannot move
	 * its revenue.
	 */
	private async copyPricing(
		tx: Prisma.TransactionClient,
		planId: string,
		skuSettingIds: string[]
	): Promise<void> {
		if (skuSettingIds.length === 0) return;

		const [cogs, fulfillmentCosts, prices] = await Promise.all([
			tx.skuCogs.findMany({
				where: { skuSettingId: { in: skuSettingIds } },
			}),
			tx.skuChannelFulfillmentCost.findMany({
				where: { skuSettingId: { in: skuSettingIds } },
			}),
			tx.skuChannelPrice.findMany({
				where: { skuSettingId: { in: skuSettingIds } },
			}),
		]);

		if (cogs.length > 0) {
			await tx.demandPlanCogs.createMany({
				data: cogs.map((c) => ({
					planId,
					skuSettingId: c.skuSettingId,
					materials: c.materials,
					production: c.production,
					shipping: c.shipping,
					amount: c.amount,
					effectiveFrom: c.effectiveFrom,
					note: c.note,
				})),
				skipDuplicates: true,
			});
		}

		if (fulfillmentCosts.length > 0) {
			await tx.demandPlanChannelFulfillmentCost.createMany({
				data: fulfillmentCosts.map((f) => ({
					planId,
					skuSettingId: f.skuSettingId,
					channel: f.channel,
					storage: f.storage,
					pick: f.pick,
					pack: f.pack,
					shipping: f.shipping,
					amount: f.amount,
					effectiveFrom: f.effectiveFrom,
					note: f.note,
				})),
				skipDuplicates: true,
			});
		}

		if (prices.length > 0) {
			await tx.demandPlanChannelPrice.createMany({
				data: prices.map((p) => ({
					planId,
					skuSettingId: p.skuSettingId,
					channel: p.channel,
					amount: p.amount,
					effectiveFrom: p.effectiveFrom,
					note: p.note,
				})),
				skipDuplicates: true,
			});
		}
	}
}
