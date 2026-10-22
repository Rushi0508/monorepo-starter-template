import PlanWorkspaceComponent from '@/components/demand-planning/workspace/PlanWorkspaceComponent';

const PlanWorkspacePage = async ({
	params,
}: {
	params: Promise<{ planId: string }>;
}) => {
	const { planId } = await params;
	return <PlanWorkspaceComponent planId={planId} />;
};

export default PlanWorkspacePage;
