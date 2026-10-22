import type { DataPipelineType } from '@repo/types';
import { omitNulls } from '../../lib/shape.js';

export function shapeDataPipelines(pipelines: DataPipelineType[]) {
	const rows = pipelines.map((p) =>
		omitNulls({
			name: p.name,
			source: p.source,
			status: p.status,
			lastSyncedAt: p.lastSyncedAt
				? new Date(p.lastSyncedAt).toISOString()
				: undefined,
			lastSyncDurationMs: p.lastSyncDurationMs,
			error: p.lastSyncError || undefined,
		})
	);

	const failed = rows.filter((r) => r.status === 'FAILED').length;
	const running = rows.filter((r) => r.status === 'RUNNING').length;
	const paused = rows.filter((r) => r.status === 'PAUSED').length;

	return omitNulls({
		pipelineCount: rows.length,
		failedCount: failed || undefined,
		runningCount: running || undefined,
		pausedCount: paused || undefined,
		pipelines: rows,
	});
}
