import PlanWorkspaceComponent from '@/components/demand-planning/workspace/PlanWorkspaceComponent';

const ScenarioDetailPage = async ({
	params,
}: {
	params: Promise<{ scenarioId: string }>;
}) => {
	const { scenarioId } = await params;
	return <PlanWorkspaceComponent planId={scenarioId} />;
};

export default ScenarioDetailPage;
