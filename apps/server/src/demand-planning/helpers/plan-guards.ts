import { ConflictException } from '@nestjs/common';
import { DemandPlanKind, DemandPlanStatus, type Prisma } from '@repo/db';

type Client = {
	demandPlan: {
		findFirst: (
			args: Prisma.DemandPlanFindFirstArgs
		) => Promise<{ name: string } | null>;
	};
};

export async function assertNoOpenDraft(prisma: Client): Promise<void> {
	const openDraft = await prisma.demandPlan.findFirst({
		where: { kind: DemandPlanKind.BASE, status: DemandPlanStatus.DRAFT },
	});
	if (openDraft) {
		throw new ConflictException(
			`"${openDraft.name}" is already open as a draft. Finalize or delete it first.`
		);
	}
}

/** Forecast Accuracy keys plans by month, so a second one would shadow it. */
export async function assertCycleFree(
	prisma: Client,
	planMonth: string,
	exceptId?: string
): Promise<void> {
	const clash = await prisma.demandPlan.findFirst({
		where: {
			kind: DemandPlanKind.BASE,
			planMonth,
			...(exceptId ? { id: { not: exceptId } } : {}),
		},
	});
	if (clash) {
		throw new ConflictException(
			`"${clash.name}" already covers ${planMonth}. Only one base plan can hold a cycle month.`
		);
	}
}
