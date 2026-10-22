'use client';

import type { DemandPlanType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Plus, Upload } from 'lucide-react';
import { PageHeader } from '@/components/general/PageHeader';
import { PlanSummaryCard, PlanSummaryCardSkeleton } from './PlanSummaryCard';

const PAGE_DESCRIPTION =
	'Plan demand in units by channel and SKU, across one calendar year. Revenue is derived, never an input.';

const SCENARIO_DESCRIPTION =
	'A fork of a plan, with its own scope, methods and prices. Nothing here touches what the business has committed to.';

interface PlanWorkspaceHeaderProps {
	/** Null once loaded and no plan exists yet. */
	plan: DemandPlanType | null;
	isLoading: boolean;
	isScenario: boolean;
	onConfigure: () => void;
	onNewPlan: () => void;
	onViewActivity: () => void;
	onFinalize: () => void;
	onImport: () => void;
	canImport: boolean;
}

/**
 * The page title and New plan never wait on data — they are true before any
 * plan exists, so skeletoning them would hide the one control that fixes an
 * empty workspace. Only the plan summary below has anything to load.
 */
export const PlanWorkspaceHeader = ({
	plan,
	isLoading,
	isScenario,
	onConfigure,
	onNewPlan,
	onViewActivity,
	onFinalize,
	onImport,
	canImport,
}: PlanWorkspaceHeaderProps) => {
	return (
		<div className='space-y-3'>
			<PageHeader
				title={isScenario ? 'Scenario Planning' : 'Demand Planning'}
				description={isScenario ? SCENARIO_DESCRIPTION : PAGE_DESCRIPTION}
				actions={
					<div className='flex items-center gap-2'>
						{canImport && (
							<Button variant='outline' size='sm' onClick={onImport}>
								<Upload className='size-4' />
								Import
							</Button>
						)}
						<Button size='sm' onClick={onNewPlan}>
							<Plus className='size-4' />
							{isScenario ? 'New scenario' : 'New plan'}
						</Button>
					</div>
				}
			/>

			{isLoading && <PlanSummaryCardSkeleton />}

			{!isLoading && plan && (
				<PlanSummaryCard
					plan={plan}
					onConfigure={onConfigure}
					onViewActivity={onViewActivity}
					onFinalize={onFinalize}
				/>
			)}
		</div>
	);
};

export default PlanWorkspaceHeader;
