import { PipelineStatusEnum } from '@repo/enums/status.enum';
import { DataPipelineType } from '@repo/types/dist';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Loader2, Pause, Play, Zap } from 'lucide-react';
import { SOURCE_CONFIG } from '@/components/source-config';
import { useSetPipelinePaused, useTriggerPipeline } from '@/queries';
import { StatusBadge } from './StatusBadge';

function formatDuration(ms: number | null) {
	if (!ms) return '-';
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	return `${(ms / 60000).toFixed(1)}m`;
}

interface PipelineDetailDialogProps {
	pipeline: DataPipelineType;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const PipelineDetailDialog = ({
	pipeline,
	open,
	onOpenChange,
}: PipelineDetailDialogProps) => {
	const { mutate: triggerPipeline, isPending: isTriggering } =
		useTriggerPipeline();
	const { mutate: setPaused, isPending: isPausing } = useSetPipelinePaused();

	if (!pipeline) return null;

	const sourceConfig = SOURCE_CONFIG[pipeline.source];
	const isRunning = pipeline.status === PipelineStatusEnum.RUNNING;
	const isPaused = pipeline.status === PipelineStatusEnum.PAUSED;

	const handleTrigger = (force = false) => {
		triggerPipeline(
			{ name: pipeline.name, force },
			{ onSuccess: () => onOpenChange(false) }
		);
	};

	const handleTogglePaused = () => {
		setPaused({ name: pipeline.name, isPaused: !isPaused });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						{pipeline.name}
						<StatusBadge status={pipeline.status} />
					</DialogTitle>
					<DialogDescription>{pipeline.description}</DialogDescription>
				</DialogHeader>

				<div className='space-y-3 text-sm'>
					<div className='grid grid-cols-2 gap-3 rounded-lg border p-3'>
						<DetailItem
							label='Source'
							value={SOURCE_CONFIG[pipeline.source]?.label ?? pipeline.source}
						/>
						<DetailItem
							label='Cadence'
							value={
								pipeline.cadenceType === 'REAL_TIME'
									? 'Real-time'
									: (pipeline.cadence ?? '-')
							}
						/>
						<DetailItem
							label='Last Synced'
							value={
								pipeline.lastSyncedAt
									? formatDistanceToNow(new Date(pipeline.lastSyncedAt), {
											addSuffix: true,
										})
									: 'Never'
							}
						/>
						<DetailItem
							label='Duration'
							value={
								pipeline.lastSyncDurationMs
									? formatDuration(pipeline.lastSyncDurationMs)
									: '-'
							}
						/>
					</div>

					{pipeline.lastSyncError && (
						<div className='rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30'>
							<p className='text-xs font-medium text-red-600'>Last Error</p>
							<p className='mt-1 text-xs text-red-500'>
								{pipeline.lastSyncError}
							</p>
						</div>
					)}
					{isRunning && (
						<div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
							<p className='text-xs font-medium text-amber-600'>
								Still running?
							</p>
							<p className='mt-1 text-xs text-amber-600/80'>
								A crash or redeploy can leave a run locked here, which blocks
								every later sync. Force Run clears the lock and starts fresh —
								the last synced time is untouched, so nothing gets skipped.
							</p>
						</div>
					)}
				</div>

				<div className='flex items-center justify-between border-t pt-3'>
					{sourceConfig?.url ? (
						<a
							href={sourceConfig.url}
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
						>
							<ExternalLink className='size-3' />
							Open {sourceConfig.label}
						</a>
					) : (
						<span />
					)}

					{pipeline.cadenceType !== 'REAL_TIME' && (
						<div className='flex items-center gap-2'>
							<Button
								size='sm'
								variant='outline'
								onClick={handleTogglePaused}
								disabled={isPausing || isRunning}
							>
								{isPausing ? (
									<Loader2 className='size-4 animate-spin' />
								) : isPaused ? (
									<Play className='size-4' />
								) : (
									<Pause className='size-4' />
								)}
								{isPaused ? 'Resume' : 'Pause'}
							</Button>

							{isRunning ? (
								<Button
									size='sm'
									variant='destructive'
									onClick={() => handleTrigger(true)}
									disabled={isTriggering || isPaused}
								>
									{isTriggering ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Zap className='size-4' />
									)}
									Force Run
								</Button>
							) : (
								<Button
									size='sm'
									onClick={() => handleTrigger()}
									disabled={isTriggering || isPaused}
								>
									{isTriggering ? (
										<Loader2 className='size-4 animate-spin' />
									) : (
										<Play className='size-4' />
									)}
									Trigger Run
								</Button>
							)}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className='text-xs text-muted-foreground'>{label}</p>
			<p className='mt-0.5 font-medium'>{value}</p>
		</div>
	);
}
