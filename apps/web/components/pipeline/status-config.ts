import { PipelineStatusEnum } from '@repo/enums/dist';
import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	LucideIcon,
	PauseCircle,
} from 'lucide-react';

export const STATUS_CONFIG: Record<
	PipelineStatusEnum,
	{ label: string; icon: LucideIcon }
> = {
	[PipelineStatusEnum.SUCCESS]: {
		label: 'Success',
		icon: CheckCircle2,
	},
	[PipelineStatusEnum.RUNNING]: {
		label: 'Running',
		icon: Loader2,
	},
	[PipelineStatusEnum.FAILED]: {
		label: 'Failed',
		icon: AlertCircle,
	},
	[PipelineStatusEnum.PAUSED]: {
		label: 'Paused',
		icon: PauseCircle,
	},
} as const;
