'use client';

import type { DataPipelineType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, Radio, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import { CustomTable } from '@/components/general/CustomTable';
import { PageHeader } from '@/components/general/PageHeader';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { SOURCE_CONFIG } from '@/components/source-config';
import { useDataPipelines } from '@/queries';
import AlertMessage from '../general/AlertMessage';
import { EnumBadge } from '../general/CustomBadge';
import EmptyMessage from '../general/EmptyMessage';
import { PipelineDetailDialog } from './PipelineDetailDialog';
import { StatusBadge } from './StatusBadge';

const columns: CustomColumnDef<DataPipelineType>[] = [
	{
		accessorKey: 'name',
		header: 'Pipeline',
		enableSorting: false,
		cell: ({ row }) => (
			<div>
				<p className='font-medium'>{row.original.name}</p>
				<p className='text-xs text-muted-foreground line-clamp-1'>
					{row.original.description}
				</p>
			</div>
		),
	},
	{
		accessorKey: 'source',
		header: 'Source',
		enableSorting: false,
		cell: ({ row }) => {
			const config = SOURCE_CONFIG[row.original.source];
			return (
				<EnumBadge
					value={row.original.source}
					label={config?.label}
					className={config?.color}
				/>
			);
		},
	},
	{
		accessorKey: 'cadenceType',
		header: 'Cadence',
		enableSorting: false,
		cell: ({ row }) => (
			<div className='flex items-center gap-1.5 text-sm'>
				{row.original.cadenceType === 'REAL_TIME' ? (
					<>
						<Radio className='size-3.5 text-muted-foreground' />{' '}
						<span>Real-time</span>
					</>
				) : (
					<>
						<Clock className='size-3.5 text-muted-foreground' />{' '}
						<span>{row.original.cadence}</span>
					</>
				)}
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => <StatusBadge status={row.original.status} />,
	},
	{
		accessorKey: 'lastSyncedAt',
		header: 'Last Run',
		cell: ({ row }) => (
			<span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
				<Activity className='size-3.5' />
				{row.original.lastSyncedAt
					? formatDistanceToNow(new Date(row.original.lastSyncedAt), {
							addSuffix: true,
						})
					: 'Never'}
			</span>
		),
	},
];

const PipelineComponent = () => {
	const { data: pipelines, isLoading, error, refetch } = useDataPipelines();
	const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
		null
	);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const selectedPipeline = selectedPipelineId
		? (pipelines?.find((pipeline) => pipeline.id === selectedPipelineId) ??
			null)
		: null;

	const handleRefresh = () => {
		refetch();
		setIsRefreshing(true);
		setTimeout(() => {
			setIsRefreshing(false);
		}, 5000);
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Data Pipelines'
				description='Monitor and manage data sync workflows across different sources.'
				actions={
					<Button
						disabled={isRefreshing}
						variant='outline'
						size='sm'
						onClick={handleRefresh}
					>
						<RefreshCw
							className={cn('size-4', isRefreshing && 'animate-spin')}
						/>
						Refresh
					</Button>
				}
			/>

			{isLoading && <TableSkeleton />}

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{pipelines && (
				<CustomTable
					data={pipelines}
					columns={columns}
					onRowClick={(pipeline) => setSelectedPipelineId(pipeline.id)}
					enableSorting
					emptyState={
						<EmptyMessage
							description='Check back later for new pipelines.'
							message='No pipelines found'
							icon={<Activity className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			)}

			{selectedPipeline && (
				<PipelineDetailDialog
					pipeline={selectedPipeline}
					open={!!selectedPipeline}
					onOpenChange={(open) => !open && setSelectedPipelineId(null)}
				/>
			)}
		</div>
	);
};

export default PipelineComponent;
