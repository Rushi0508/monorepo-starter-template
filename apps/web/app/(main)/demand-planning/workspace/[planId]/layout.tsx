import { notFound } from 'next/navigation';
import type React from 'react';
import { BreadcrumbSegmentProvider } from '@/components/BreadcrumbSegmentProvider';
import { DemandPlanningService } from '@/services';

interface PlanWorkspaceLayoutProps {
	children: React.ReactNode;
	params: Promise<{ planId: string }>;
}

const PlanWorkspaceLayout = async ({
	children,
	params,
}: PlanWorkspaceLayoutProps) => {
	const { planId } = await params;
	let planName = '';

	try {
		const plan = await DemandPlanningService.getPlan(planId);
		if (!plan) return notFound();
		planName = plan.name;
	} catch {
		return notFound();
	}

	return (
		<BreadcrumbSegmentProvider segment={planId} name={planName}>
			{children}
		</BreadcrumbSegmentProvider>
	);
};

export default PlanWorkspaceLayout;
