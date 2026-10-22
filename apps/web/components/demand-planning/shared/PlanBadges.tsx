import { DemandPlanKindEnum, type DemandPlanStatusEnum } from '@repo/enums';
import type { DemandPlanType } from '@repo/types';
import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { FlaskConical, LayoutGrid, Lock, PencilLine } from 'lucide-react';
import { DEMAND_PLAN_STATUS_STYLES } from '@/components/badge-style-config';

type PlanStatus = DemandPlanType['status'];
type PlanKind = DemandPlanType['kind'];

/**
 * Base plans are *finalized*; scenarios are *saved*. Both lock the numbers, but
 * the domain uses different words and the badge should too.
 */
function statusLabel(status: PlanStatus, kind: PlanKind): string {
	if (status === 'DRAFT') return 'Draft';
	return kind === DemandPlanKindEnum.SCENARIO ? 'Saved' : 'Finalized';
}

/** A locked plan carries a lock icon so the state reads at a glance. */
export function PlanStatusBadge({
	status,
	kind = DemandPlanKindEnum.BASE,
	className,
}: {
	status: PlanStatus;
	kind?: PlanKind;
	className?: string;
}) {
	const Icon = status === 'DRAFT' ? PencilLine : Lock;

	return (
		<Badge
			className={cn(
				DEMAND_PLAN_STATUS_STYLES[status as DemandPlanStatusEnum],
				className
			)}
		>
			<Icon className='size-3' />
			{statusLabel(status, kind)}
		</Badge>
	);
}

/**
 * Scenarios sit alongside base plans in history, so both kinds render — muted
 * outline, so the column reads as a classification rather than competing with
 * the coloured status badge beside it.
 */
export function PlanKindBadge({
	kind,
	className,
}: {
	kind: PlanKind;
	className?: string;
}) {
	const isScenario = kind === DemandPlanKindEnum.SCENARIO;
	const Icon = isScenario ? FlaskConical : LayoutGrid;

	return (
		<Badge
			variant='outline'
			className={cn('text-muted-foreground whitespace-nowrap', className)}
		>
			<Icon className='size-3' />
			{isScenario ? 'Scenario' : 'Base plan'}
		</Badge>
	);
}
