import { redirect } from 'next/navigation';
import PlanWorkspaceComponent from '@/components/demand-planning/workspace/PlanWorkspaceComponent';
import { DemandPlanningService } from '@/services';

export const dynamic = 'force-dynamic';

const PlanWorkspacePage = async () => {
	const plan = await DemandPlanningService.getOperativePlan();
	if (plan) redirect(`/demand-planning/workspace/${plan.id}`);

	return <PlanWorkspaceComponent />;
};

export default PlanWorkspacePage;
