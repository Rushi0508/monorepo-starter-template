'use client';

import { DemandPlanStatusEnum } from '@repo/enums';
import type { DemandPlanType } from '@repo/types';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Separator } from '@repo/ui/components/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { cn } from '@repo/ui/lib/utils';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { useDeleteDemandPlan } from '@/queries';
import { monthsBetween, periodLabel } from '../shared/period';
import { ForecastMethodSection } from './ForecastMethodSection';
import { NewPlanDialog } from './NewPlanDialog';
import { PlanThresholdsDialog } from './PlanThresholdsDialog';
import { PricingSection } from './PricingSection';
import { SectionHeading } from './SectionHeading';

/**
 * Each section reads as a summary and opens a dialog to change anything, so the
 * panel stays scannable however many sections it grows.
 */
/** Thresholds are stored as 0–1 ratios and always read as whole percents. */
const asPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

export const PlanConfigSheet = ({
	plan,
	open,
	onClose,
	onDeleted,
}: {
	plan: DemandPlanType | null;
	open: boolean;
	onClose: () => void;
	/** The plan this panel describes is gone, so its page has to move on. */
	onDeleted?: () => void;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingThresholds, setIsEditingThresholds] = useState(false);
	const [showNotes, setShowNotes] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const { mutate: deletePlan, isPending: isDeleting } = useDeleteDemandPlan();

	if (!plan) return null;

	const isEditable = plan.status === DemandPlanStatusEnum.DRAFT;
	const notes = plan.notes?.trim();

	const skuCount = new Set(
		plan.channelScopes.flatMap((scope) => scope.skuSettingIds)
	).size;

	return (
		<>
			<Sheet open={open} onOpenChange={(next) => !next && onClose()}>
				<SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-lg overflow-y-auto'>
					<SheetHeader>
						<SheetTitle>Configure plan</SheetTitle>
						<SheetDescription>
							{isEditable
								? 'Settings that shape the forecast without being part of it.'
								: 'This plan is finalized, so its settings can no longer change.'}
						</SheetDescription>
					</SheetHeader>

					<div className='space-y-4 px-4 pb-6'>
						<section className='space-y-2'>
							<div className='min-w-0 w-full space-y-1'>
								<SectionHeading
									title={plan.name}
									onEdit={isEditable ? () => setIsEditing(true) : undefined}
									headingClassName='truncate text-base'
								/>
								<p className='mt-0.5 text-xs text-muted-foreground'>
									{periodLabel(plan.planMonth)} → {periodLabel(plan.horizonEnd)}
									<span className='mx-1.5'>·</span>
									{monthsBetween(plan.planMonth, plan.horizonEnd)} months
								</p>
							</div>

							<div className='space-y-1.5'>
								<p className='text-xs font-medium'>
									{plan.channelScopes.length}{' '}
									{plan.channelScopes.length === 1 ? 'channel' : 'channels'}
									<span className='mx-1.5 text-muted-foreground'>·</span>
									{skuCount} {skuCount === 1 ? 'SKU' : 'SKUs'}
								</p>

								{plan.channelScopes.length > 0 ? (
									<div className='flex flex-wrap gap-1.5'>
										{plan.channelScopes.map((scope) => (
											<Badge key={scope.channel} variant='outline'>
												{scope.channel}
												<span className='ml-1 tabular-nums'>
													{scope.skuSettingIds.length}
												</span>
											</Badge>
										))}
									</div>
								) : (
									<p className='text-xs text-muted-foreground'>
										Nothing in scope yet.
									</p>
								)}
							</div>

							{notes ? (
								<div className='space-y-2'>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className='h-auto px-0! text-xs text-muted-foreground hover:bg-transparent'
										aria-expanded={showNotes}
										onClick={() => setShowNotes((open) => !open)}
									>
										{showNotes ? 'Collapse notes' : 'View notes'}
										<ChevronDown
											className={cn(
												'size-3.5 transition-transform',
												showNotes && 'rotate-180'
											)}
										/>
									</Button>

									{showNotes && (
										<p className='whitespace-pre-wrap rounded-md border bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground'>
											{notes}
										</p>
									)}
								</div>
							) : (
								<p className='text-xs text-muted-foreground'>No notes.</p>
							)}
						</section>

						<Separator />

						<section className='space-y-2'>
							<div className='space-y-1'>
								<SectionHeading
									title='Override thresholds'
									onEdit={
										isEditable ? () => setIsEditingThresholds(true) : undefined
									}
								/>
								<p className='text-xs text-muted-foreground'>
									How far a typed number may sit from the statistical forecast
									before the grid reacts. Neither threshold blocks an override.
								</p>

								<dl className='grid grid-cols-2 gap-2 pt-1'>
									<div className='rounded-md border px-3 py-2'>
										<dt className='text-xs text-muted-foreground'>
											Flag above
										</dt>
										<dd className='text-sm font-medium tabular-nums'>
											{asPercent(plan.flagOverrideAbovePct)}
										</dd>
									</div>
									<div className='rounded-md border px-3 py-2'>
										<dt className='text-xs text-muted-foreground'>
											Require reason above
										</dt>
										<dd className='text-sm font-medium tabular-nums'>
											{asPercent(plan.requireReasonAbovePct)}
										</dd>
									</div>
								</dl>
							</div>
						</section>

						<Separator />

						<ForecastMethodSection plan={plan} isEditable={isEditable} />

						<Separator />

						<PricingSection plan={plan} isEditable={isEditable} />
					</div>

					{isEditable && (
						<div className='border-t px-4 py-4'>
							<p className='text-sm font-medium'>Delete this plan</p>
							<p className='text-xs text-muted-foreground'>
								Removes the plan and everything scoped to it — forecast methods,
								overrides, pricing and its activity trail.
							</p>
							<Button
								type='button'
								variant='destructive'
								size='sm'
								className='mt-2'
								onClick={() => setConfirmingDelete(true)}
							>
								<Trash2 className='size-4' />
								Delete plan
							</Button>
						</div>
					)}
				</SheetContent>
			</Sheet>

			<PlanThresholdsDialog
				plan={plan}
				open={isEditingThresholds}
				onClose={() => setIsEditingThresholds(false)}
			/>

			<NewPlanDialog
				plan={plan}
				open={isEditing}
				onClose={() => setIsEditing(false)}
			/>

			<CustomAlertDialog
				isOpen={confirmingDelete}
				onClose={() => setConfirmingDelete(false)}
				onConfirm={() =>
					deletePlan(plan.id, {
						onSuccess: () => {
							setConfirmingDelete(false);
							onClose();
							onDeleted?.();
						},
					})
				}
				isLoading={isDeleting}
				title='Delete plan?'
				description={`"${plan.name}" and everything in it — forecast methods, overrides and its activity trail — will be permanently removed. This cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
			/>
		</>
	);
};

export default PlanConfigSheet;
