import type { DemandActual, Prisma } from '@repo/db';

type Plan = Prisma.DemandPlanGetPayload<{ include: { channelScopes: true } }>;

type Client = {
	demandActual: {
		findMany: (
			args: Prisma.DemandActualFindManyArgs
		) => Promise<DemandActual[]>;
	};
};

export type BaselineRow = {
	planId: string;
	channel: string;
	skuSettingId: string;
	period: string;
	units: number;
	grossRevenue: number;
	netRevenue: number;
};

/**
 * The actuals a plan projects from, as they stand right now.
 *
 * Only closed months, and only those the forecast could already see: the plan
 * month itself is still accruing, and a half month averaged in as a whole one
 * would drag every projection built on top of it.
 */
export async function freezeBaselineFor(
	prisma: Client,
	plan: Plan
): Promise<BaselineRow[]> {
	const inScope = new Set(
		plan.channelScopes.flatMap((scope) =>
			scope.skuSettingIds.map((skuId) => `${scope.channel}|${skuId}`)
		)
	);
	if (inScope.size === 0) return [];

	const closed = await prisma.demandActual.findMany({
		where: {
			skuSettingId: {
				in: [...new Set(plan.channelScopes.flatMap((s) => s.skuSettingIds))],
			},
			period: { lt: plan.planMonth },
			isPartial: false,
		},
	});

	return closed
		.filter((actual) => inScope.has(`${actual.channel}|${actual.skuSettingId}`))
		.map((actual) => ({
			planId: plan.id,
			channel: actual.channel,
			skuSettingId: actual.skuSettingId,
			period: actual.period,
			units: actual.units,
			grossRevenue: actual.grossRevenue,
			netRevenue: actual.netRevenue,
		}));
}
