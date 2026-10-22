import { InboundEmailStatusEnum } from '@repo/enums';
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Loader2,
	type LucideIcon,
} from 'lucide-react';

export const INBOUND_EMAIL_STATUS_CONFIG: Record<
	InboundEmailStatusEnum,
	{
		label: string;
		variant: 'default' | 'secondary' | 'outline' | 'destructive';
		icon: LucideIcon;
		spin?: boolean;
	}
> = {
	[InboundEmailStatusEnum.PENDING]: {
		label: 'Pending',
		variant: 'secondary',
		icon: Clock,
	},
	[InboundEmailStatusEnum.PROCESSING]: {
		label: 'Processing',
		variant: 'outline',
		icon: Loader2,
		spin: true,
	},
	[InboundEmailStatusEnum.PROCESSED]: {
		label: 'Processed',
		variant: 'default',
		icon: CheckCircle2,
	},
	[InboundEmailStatusEnum.FAILED]: {
		label: 'Failed',
		variant: 'destructive',
		icon: AlertCircle,
	},
};

export function getInboundEmailStatusConfig(status: string) {
	return (
		INBOUND_EMAIL_STATUS_CONFIG[status as InboundEmailStatusEnum] ?? {
			label: status,
			variant: 'secondary' as const,
			icon: Clock,
		}
	);
}
