import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { EnumBadge } from '../general/CustomBadge';
import { STATUS_CONFIG } from './status-config';

export const StatusBadge = ({ status }: { status: string | null }) => {
	if (!status) {
		return <span>-</span>;
	}
	const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
	if (!config) return <Badge variant='outline'>{status}</Badge>;
	const Icon = config.icon;
	return (
		<EnumBadge
			value={status}
			label={config.label}
			icon={
				<Icon
					className={cn('size-3', status === 'RUNNING' && 'animate-spin')}
				/>
			}
		/>
	);
};
