import { notFound } from 'next/navigation';
import type React from 'react';
import { BreadcrumbSegmentProvider } from '@/components/BreadcrumbSegmentProvider';
import { DemandPlanningService } from '@/services';

interface ScenarioLayoutProps {
	children: React.ReactNode;
	params: Promise<{ scenarioId: string }>;
}

const ScenarioLayout = async ({ children, params }: ScenarioLayoutProps) => {
	const { scenarioId } = await params;
	let scenarioName = '';

	try {
		const scenario = await DemandPlanningService.getPlan(scenarioId);
		if (!scenario) return notFound();
		scenarioName = scenario.name;
	} catch {
		return notFound();
	}

	return (
		<BreadcrumbSegmentProvider segment={scenarioId} name={scenarioName}>
			{children}
		</BreadcrumbSegmentProvider>
	);
};

export default ScenarioLayout;
