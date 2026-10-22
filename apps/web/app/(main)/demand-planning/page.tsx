'use client';

import {
	FlaskConical,
	GitCompare,
	History,
	LayoutGrid,
	Target,
} from 'lucide-react';
import { RootLayoutForNestedRoute } from '@/components/layout/RootLayoutForNestedRoute';

const DemandPlanningPage = () => {
	return (
		<RootLayoutForNestedRoute
			title='Demand Planning'
			description='Plan demand in units by channel and SKU. Revenue is derived, never an input.'
			sections={[
				{
					title: 'Plan Workspace',
					description:
						'The working grid for the open cycle - forecast methods, manual overrides and the finalize flow.',
					href: '/workspace',
					icon: LayoutGrid,
				},
				{
					title: 'Scenario Plans',
					description:
						'Fork the current plan to price an opportunity without touching what the business has committed to.',
					href: '/scenarios',
					icon: FlaskConical,
				},
				{
					title: 'Plan History',
					description:
						'Every finalized plan, newest first. Finalized plans are immutable and reproduce exactly what was signed off.',
					href: '/history',
					icon: History,
				},
				{
					title: 'Compare Plans',
					description:
						'Diff two plans over their shared horizon and see whether growth came from volume or from price.',
					href: '/compare',
					icon: GitCompare,
				},
				{
					title: 'Forecast Accuracy',
					description:
						'How good were we? Every month scored against the frozen forecast that existed at the time.',
					href: '/accuracy',
					icon: Target,
				},
			]}
		/>
	);
};

export default DemandPlanningPage;
