'use client';

import type { DemandPlanListItemType } from '@repo/types';
import { formatCurrency } from '@repo/utils';
import { format } from 'date-fns';
import { FileClock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import {
	type CustomColumnDef,
	CustomTable,
} from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import { useDeleteDemandPlan } from '@/queries';
import { PlanKindBadge, PlanStatusBadge } from '../shared/PlanBadges';
import { monthsBetween, periodLabel } from '../shared/period';

/**
 * Built as a function so the delete action can close over the row handler; the
 * button only appears on row hover, so the column reads as empty until needed.
 */
const buildPlanCols = (
	onDelete: (plan: DemandPlanListItemType) => void
): CustomColumnDef<DemandPlanListItemType>[] => [
	{
		id: 'name',
		header: 'Plan',
		accessorKey: 'name',
		cell: ({ row }) => (
			<div className='flex flex-col gap-0.5'>
				<span className='font-medium'>{row.original.name}</span>
			</div>
		),
		enableSorting: true,
	},
	{
		id: 'kind',
		header: 'Type',
		accessorKey: 'kind',
		cell: ({ row }) => <PlanKindBadge kind={row.original.kind} />,
		enableSorting: true,
	},
	{
		id: 'horizon',
		header: 'Horizon',
		accessorKey: 'planMonth',
		cell: ({ row }) => (
			<div className='flex flex-col gap-0.5 whitespace-nowrap'>
				<span>
					{periodLabel(row.original.planMonth)} –{' '}
					{periodLabel(row.original.horizonEnd)}
				</span>
				<span className='text-muted-foreground'>
					{monthsBetween(row.original.planMonth, row.original.horizonEnd)}{' '}
					months
				</span>
			</div>
		),
		enableSorting: true,
	},
	{
		id: 'status',
		header: 'Status',
		accessorKey: 'status',
		cell: ({ row }) => (
			<PlanStatusBadge status={row.original.status} kind={row.original.kind} />
		),
		enableSorting: true,
	},
	{
		// Volume is the plan; revenue is derived from it, so they read as one fact.
		id: 'planned',
		header: 'Planned',
		accessorKey: 'totalCases',
		cell: ({ row }) => (
			<div className='flex flex-col gap-0.5'>
				<span className='font-medium'>
					{row.original.totalCases.toLocaleString()} cases
				</span>
				<span className='text-muted-foreground'>
					{formatCurrency(row.original.totalRevenue)}
				</span>
			</div>
		),
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
	{
		id: 'overrideCount',
		header: 'Overrides',
		accessorKey: 'overrideCount',
		cell: ({ row }) => row.original.overrideCount.toLocaleString(),
		cellClassName: 'tabular-nums',
		enableSorting: true,
	},
	{
		id: 'createdBy',
		header: 'Created by',
		accessorKey: 'createdBy',
		cell: ({ row }) => row.original.createdBy ?? '—',
		enableSorting: true,
	},
	{
		id: 'closedAt',
		header: 'Locked',
		accessorFn: (row) => row.finalizedAt ?? row.savedAt ?? null,
		cell: ({ row }) => {
			// Base plans are finalized, scenarios are saved — both lock the numbers.
			const lockedAt = row.original.finalizedAt ?? row.original.savedAt;
			const lockedBy = row.original.finalizedBy;

			if (!lockedAt) {
				return <span className='text-muted-foreground'>Open</span>;
			}

			return (
				<div className='flex flex-col gap-0.5'>
					<span>{format(new Date(lockedAt), 'MMM d, yyyy')}</span>
					{lockedBy && (
						<span className='text-muted-foreground'>{lockedBy}</span>
					)}
				</div>
			);
		},
		enableSorting: true,
	},
	{
		id: 'actions',
		header: '',
		enableSorting: false,
		cell: ({ row }) => (
			<button
				type='button'
				aria-label={`Delete ${row.original.name}`}
				onClick={(event) => {
					event.stopPropagation();
					onDelete(row.original);
				}}
				className='text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-destructive focus-visible:opacity-100'
			>
				<Trash2 className='size-4' />
			</button>
		),
	},
];

/** Every plan, newest first. */
export function PlanHistoryTable({
	plans,
}: {
	plans: DemandPlanListItemType[];
}) {
	const [deleteTarget, setDeleteTarget] =
		useState<DemandPlanListItemType | null>(null);
	const router = useRouter();
	const { mutate: deletePlan, isPending } = useDeleteDemandPlan();

	const columns = useMemo(() => buildPlanCols(setDeleteTarget), []);

	const handleDelete = () => {
		if (!deleteTarget) return;
		deletePlan(deleteTarget.id, {
			onSuccess: () => setDeleteTarget(null),
		});
	};

	return (
		<>
			<CustomTable
				onRowClick={(plan) =>
					router.push(`/demand-planning/workspace/${plan.id}`)
				}
				data={plans}
				columns={columns}
				getRowClassName={() => 'group/row'}
				enableSorting
				headerClassName='text-primary font-semibold text-xs'
				cellClassName='text-primary text-xs'
				emptyState={
					<EmptyMessage
						icon={<FileClock className='size-8 text-muted-foreground' />}
						message='No plans yet'
						description='Plans appear here once one has been created.'
					/>
				}
			/>

			<CustomAlertDialog
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={() => {
					handleDelete();
				}}
				isLoading={isPending}
				title='Delete plan?'
				description={`"${deleteTarget?.name ?? ''}" and everything in it — forecast methods, overrides and its activity trail — will be permanently removed. This cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
			/>
		</>
	);
}

export default PlanHistoryTable;
