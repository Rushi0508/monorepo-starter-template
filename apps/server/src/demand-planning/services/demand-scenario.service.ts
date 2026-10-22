import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { DemandPlanKind, DemandPlanStatus, type Prisma } from '@repo/db';
import type { DemandPlanType, DemandScenarioListItemType } from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CreateDemandScenarioDto } from '../dto/demand-scenario.dto';
import { freezeBaselineFor } from '../helpers/baseline';
import { addMonths, currentPeriod, monthsBetween } from '../helpers/period';
import { assertCycleFree, assertNoOpenDraft } from '../helpers/plan-guards';
import { DemandGridService } from './demand-grid.service';

/**
 * A scenario is a full fork of a plan — its own scope, methods, overrides and
 * price ladder — so pricing an opportunity can never disturb what the business
 * has committed to.
 */
@Injectable()
export class DemandScenarioService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly grid: DemandGridService
	) {}

	async list(basePlanId?: string): Promise<DemandScenarioListItemType[]> {
		const scenarios = await this.prisma.demandPlan.findMany({
			where: {
				kind: DemandPlanKind.SCENARIO,
				...(basePlanId ? { basePlanId } : {}),
			},
			orderBy: { createdAt: 'desc' },
			include: {
				createdBy: { select: { name: true } },
				finalizedBy: { select: { name: true } },
			},
		});
		if (scenarios.length === 0) return [];

		const baseIds = [
			...new Set(
				scenarios
					.map((s) => s.basePlanId)
					.filter((id): id is string => id !== null)
			),
		];
		const bases = await this.prisma.demandPlan.findMany({
			where: { id: { in: baseIds } },
			select: { id: true, name: true },
		});
		const baseName = new Map(bases.map((b) => [b.id, b.name]));

		const overrides = await this.prisma.demandPlanEntry.groupBy({
			by: ['planId'],
			_count: { _all: true },
		});
		const overrideByPlan = new Map(
			overrides.map((o) => [o.planId, o._count._all])
		);

		const grids = await this.grid.getGridsFor(scenarios.map((s) => s.id));

		return scenarios.map(({ createdBy, finalizedBy, ...plan }) => {
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
				basePlanName: baseName.get(plan.basePlanId ?? '') ?? null,
			};
		});
	}

	async create(
		dto: CreateDemandScenarioDto,
		session: UserSession
	): Promise<DemandPlanType> {
		const base = await this.prisma.demandPlan.findUnique({
			where: { id: dto.basePlanId },
			include: { channelScopes: true },
		});
		if (!base) throw new NotFoundException('Base plan not found');

		// Forking a scenario keeps the original base, so every scenario is one
		// step from a plan rather than a chain nobody can trace.
		return this.fork({
			source: base,
			basePlanId:
				base.kind === DemandPlanKind.SCENARIO
					? (base.basePlanId ?? base.id)
					: base.id,
			name: dto.name,
			notes: dto.notes ?? '',
			session,
			activity: `forked the scenario from "${base.name}"`,
		});
	}

	async duplicate(id: string, session: UserSession): Promise<DemandPlanType> {
		const source = await this.requireScenario(id);
		return this.fork({
			source,
			basePlanId: source.basePlanId ?? source.id,
			name: `${source.name} (copy)`,
			notes: source.notes,
			session,
			activity: `duplicated the scenario from "${source.name}"`,
		});
	}

	/** Saving locks a scenario the way finalizing locks a base plan. */
	async save(id: string, session: UserSession): Promise<DemandPlanType> {
		const scenario = await this.requireScenario(id);
		if (scenario.status === DemandPlanStatus.SAVED) {
			throw new ConflictException('This scenario is already saved.');
		}

		const baseline = await freezeBaselineFor(this.prisma, scenario);

		return this.prisma.$transaction(async (tx) => {
			if (baseline.length > 0) {
				await tx.demandPlanBaselineActual.createMany({
					data: baseline,
					skipDuplicates: true,
				});
			}
			const saved = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					status: DemandPlanStatus.SAVED,
					savedAt: new Date(),
					savedById: session.user.id,
				},
			});
			await tx.demandPlanAudit.create({
				data: {
					planId: id,
					activity: `${session.user.name} saved the scenario, freezing ${new Set(baseline.map((row) => row.period)).size} months of actuals`,
					userId: session.user.id,
				},
			});
			return saved;
		});
	}

	/** Nothing is scored against a scenario, so locking it is reversible. */
	async reopen(id: string, session: UserSession): Promise<DemandPlanType> {
		const scenario = await this.requireScenario(id);
		if (scenario.status !== DemandPlanStatus.SAVED) {
			throw new ConflictException('This scenario is not saved.');
		}

		return this.prisma.$transaction(async (tx) => {
			await tx.demandPlanBaselineActual.deleteMany({ where: { planId: id } });
			const reopened = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					status: DemandPlanStatus.DRAFT,
					savedAt: null,
					savedById: null,
				},
			});
			await tx.demandPlanAudit.create({
				data: {
					planId: id,
					activity: `${session.user.name} reopened the scenario for editing`,
					userId: session.user.id,
				},
			});
			return reopened;
		});
	}

	/**
	 * Promotes a scenario to a base plan. Only one base plan may be open at a
	 * time, so the scenario takes the place of a draft rather than joining it.
	 */
	async promote(id: string, session: UserSession): Promise<DemandPlanType> {
		const scenario = await this.requireScenario(id);

		await assertNoOpenDraft(this.prisma);

		// Its own cycle belongs to the plan it was forked from, so it commits as
		// the next one — the month you are in, or the month after that plan.
		const nextAfterBase = addMonths(scenario.planMonth, 1);
		const now = currentPeriod();
		const planMonth = now > nextAfterBase ? now : nextAfterBase;
		await assertCycleFree(this.prisma, planMonth, id);

		return this.prisma.$transaction(async (tx) => {
			await tx.demandPlanBaselineActual.deleteMany({ where: { planId: id } });
			const promoted = await tx.demandPlan.update({
				where: { id },
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					kind: DemandPlanKind.BASE,
					status: DemandPlanStatus.DRAFT,
					basePlanId: null,
					savedAt: null,
					savedById: null,
					planMonth,
					horizonEnd: addMonths(
						scenario.horizonEnd,
						monthsBetween(scenario.planMonth, planMonth)
					),
				},
			});
			await tx.demandPlanAudit.create({
				data: {
					planId: id,
					activity: `${session.user.name} promoted the scenario to the ${planMonth} base plan`,
					userId: session.user.id,
				},
			});
			return promoted;
		});
	}

	async remove(id: string): Promise<{ message: string }> {
		await this.requireScenario(id);
		await this.prisma.demandPlan.delete({ where: { id } });
		return { message: 'Scenario deleted' };
	}

	private async requireScenario(id: string) {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Scenario not found');
		if (plan.kind !== DemandPlanKind.SCENARIO) {
			throw new BadRequestException('That plan is not a scenario.');
		}
		return plan;
	}

	private async fork(args: {
		source: Prisma.DemandPlanGetPayload<{ include: { channelScopes: true } }>;
		basePlanId: string;
		name: string;
		notes: string;
		session: UserSession;
		activity: string;
	}): Promise<DemandPlanType> {
		const { source, basePlanId, name, notes, session, activity } = args;

		const [methods, cogs, fulfillment, prices, entries] = await Promise.all([
			this.prisma.demandForecastMethod.findMany({
				where: { planId: source.id },
			}),
			this.prisma.demandPlanCogs.findMany({ where: { planId: source.id } }),
			this.prisma.demandPlanChannelFulfillmentCost.findMany({
				where: { planId: source.id },
			}),
			this.prisma.demandPlanChannelPrice.findMany({
				where: { planId: source.id },
			}),
			this.prisma.demandPlanEntry.findMany({ where: { planId: source.id } }),
		]);

		return this.prisma.$transaction(async (tx) => {
			const scenario = await tx.demandPlan.create({
				include: { channelScopes: { orderBy: { channel: 'asc' } } },
				data: {
					name,
					notes,
					kind: DemandPlanKind.SCENARIO,
					status: DemandPlanStatus.DRAFT,
					basePlanId,
					planMonth: source.planMonth,
					horizonEnd: source.horizonEnd,
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

			const planId = scenario.id;
			if (methods.length > 0) {
				await tx.demandForecastMethod.createMany({
					data: methods.map((m) => ({
						planId,
						channel: m.channel,
						skuSettingId: m.skuSettingId,
						method: m.method,
						growthPct: m.growthPct,
						windowMonths: m.windowMonths,
					})),
				});
			}
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
				});
			}
			if (fulfillment.length > 0) {
				await tx.demandPlanChannelFulfillmentCost.createMany({
					data: fulfillment.map((f) => ({
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
				});
			}
			if (entries.length > 0) {
				await tx.demandPlanEntry.createMany({
					data: entries.map((e) => ({
						planId,
						channel: e.channel,
						skuSettingId: e.skuSettingId,
						period: e.period,
						units: e.units,
						reason: e.reason,
						note: e.note,
						createdById: session.user.id,
					})),
				});
			}

			await tx.demandPlanAudit.create({
				data: {
					planId,
					activity: `${session.user.name} ${activity}`,
					userId: session.user.id,
				},
			});

			return scenario;
		});
	}
}
