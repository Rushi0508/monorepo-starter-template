'use client';

import { DemandOverrideReasonEnum } from '@repo/enums';
import type { DemandPlanType, SkuOptionType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { Label } from '@repo/ui/components/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { useEffect, useState } from 'react';
import LoadingButton from '@/components/general/LoadingButton';
import { useSetDemandEntry } from '@/queries';
import { OVERRIDE_REASON_LABELS, skuLabel } from '../shared/constants';
import { periodLabel } from '../shared/period';

export type OverrideTarget = {
	channel: string;
	skuSettingId: string;
	period: string;
	statistical: number | null;
	/** What the cell held before this edit. */
	previous: number | null;
	/** What was just typed. Null when opened to inspect an existing override. */
	next: number | null;
	/** What is already recorded against the cell, if anything. */
	reason: DemandOverrideReasonEnum | null;
	note: string | null;
};

/**
 * Captures why a cell departs from the forecast.
 *
 * A change beyond the plan's reason threshold is refused by the API without
 * one, so this is the only way such an edit can be completed — and the same
 * panel is how an existing override is revisited or undone.
 */
export const OverrideDialog = ({
	plan,
	target,
	sku,
	onClose,
}: {
	plan: DemandPlanType;
	target: OverrideTarget | null;
	sku?: SkuOptionType;
	onClose: () => void;
}) => {
	const { mutate: setEntry, isPending } = useSetDemandEntry(plan.id);

	const [reason, setReason] = useState<DemandOverrideReasonEnum>(
		DemandOverrideReasonEnum.MANUAL_ADJUSTMENT
	);
	const [note, setNote] = useState('');

	useEffect(() => {
		if (!target) return;
		setReason(target.reason ?? DemandOverrideReasonEnum.MANUAL_ADJUSTMENT);
		setNote(target.note ?? '');
	}, [target]);

	if (!target) return null;

	const value = target.next ?? target.previous ?? 0;
	const deviation =
		target.statistical && target.statistical !== 0
			? Math.abs(value - target.statistical) / target.statistical
			: null;
	const isOutsideTolerance =
		deviation !== null && deviation > plan.requireReasonAbovePct;

	const save = () =>
		setEntry(
			{
				channel: target.channel as never,
				skuSettingId: target.skuSettingId,
				period: target.period,
				units: value,
				reason,
				note: note.trim() || undefined,
			},
			{ onSuccess: () => onClose() }
		);

	const reset = () =>
		setEntry(
			{
				channel: target.channel as never,
				skuSettingId: target.skuSettingId,
				period: target.period,
				units: null,
			},
			{ onSuccess: () => onClose() }
		);

	return (
		<Dialog open onOpenChange={(next) => !next && onClose()}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex flex-wrap items-baseline gap-2'>
						Manual override
						{isOutsideTolerance && deviation !== null && (
							<span className='text-sm font-normal text-amber-600'>
								(Outside tolerance · {Math.round(deviation * 100)}%)
							</span>
						)}
					</DialogTitle>
					<DialogDescription>
						{isOutsideTolerance
							? `A change this far from the forecast needs a reason — over ${Math.round(plan.requireReasonAbovePct * 100)}%.`
							: 'Recorded against this cell and in the plan’s activity.'}
					</DialogDescription>
				</DialogHeader>

				<dl className='space-y-2 text-sm'>
					<div className='flex gap-3'>
						<dt className='w-24 shrink-0 text-muted-foreground'>Cell</dt>
						<dd>
							{target.channel} · {skuLabel(sku)} · {periodLabel(target.period)}
						</dd>
					</div>
					<div className='flex gap-3'>
						<dt className='w-24 shrink-0 text-muted-foreground'>Statistical</dt>
						<dd className='tabular-nums'>{target.statistical ?? '—'}</dd>
					</div>
					<div className='flex gap-3'>
						<dt className='w-24 shrink-0 text-muted-foreground'>Change</dt>
						<dd className='tabular-nums'>
							{target.previous ?? '—'} <span className='mx-1'>→</span>
							<span className='font-medium'>{value}</span>
						</dd>
					</div>
				</dl>

				<div className='space-y-2'>
					<Label htmlFor='override-reason'>Reason</Label>
					<Select
						value={reason}
						onValueChange={(next) =>
							setReason(next as DemandOverrideReasonEnum)
						}
					>
						<SelectTrigger id='override-reason' className='w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.values(DemandOverrideReasonEnum).map((value) => (
								<SelectItem key={value} value={value}>
									{OVERRIDE_REASON_LABELS[value]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='override-note'>Note</Label>
					<Textarea
						id='override-note'
						rows={3}
						placeholder='Anything a reviewer would need to know.'
						value={note}
						onChange={(event) => setNote(event.target.value)}
					/>
				</div>

				<DialogFooter className='sm:justify-between'>
					<Button
						type='button'
						variant='outline'
						onClick={reset}
						disabled={isPending}
					>
						Reset to statistical
					</Button>
					<div className='flex gap-2'>
						<Button type='button' variant='ghost' onClick={onClose}>
							Cancel
						</Button>
						<LoadingButton type='button' isLoading={isPending} onClick={save}>
							Save override
						</LoadingButton>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default OverrideDialog;
