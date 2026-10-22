import { ConflictException } from '@nestjs/common';
import { DemandPlanKind, DemandPlanStatus } from '@repo/db';

type Lockable = { status: string; kind: string };

export const isPlanLocked = (plan: Lockable): boolean =>
	plan.status !== DemandPlanStatus.DRAFT;

export function assertPlanEditable(plan: Lockable): void {
	if (!isPlanLocked(plan)) return;

	throw new ConflictException(
		plan.kind === DemandPlanKind.SCENARIO
			? 'A saved scenario cannot be edited. Reopen it to make changes.'
			: 'A finalized plan cannot be edited. Create a new plan instead.'
	);
}
