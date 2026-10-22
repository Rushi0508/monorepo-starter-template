'use client';

import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { getInboundEmailStatusConfig } from './status-config';

export function InboundEmailStatusBadge({
	status,
	className,
}: {
	status: string;
	className?: string;
}) {
	const config = getInboundEmailStatusConfig(status);
	const Icon = config.icon;

	return (
		<Badge variant={config.variant} className={className}>
			<Icon className={cn('size-3', config.spin && 'animate-spin')} />
			{config.label}
		</Badge>
	);
}
