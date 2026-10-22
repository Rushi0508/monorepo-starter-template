import { PipelineStatusEnum } from '@repo/enums';
import { Badge } from '@repo/ui/components/badge';
import { cn } from '@repo/ui/lib/utils';
import { enumToText } from '@repo/utils';
import { ChevronDown } from 'lucide-react';
import React from 'react';

type Statuses = PipelineStatusEnum;

interface EnumBadgeProps {
	value: Statuses | string;
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	showChevron?: boolean;
	className?: string;
	allCaps?: boolean;
	label?: string;
}

export const EnumBadge = ({
	label,
	value,
	icon,
	iconPosition = 'left',
	showChevron = false,
	className,
	allCaps = false,
}: EnumBadgeProps) => {
	const statusClasses: Record<Statuses, string> = {
		[PipelineStatusEnum.RUNNING]:
			'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
		[PipelineStatusEnum.SUCCESS]:
			'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
		[PipelineStatusEnum.FAILED]:
			'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
		[PipelineStatusEnum.PAUSED]:
			'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
	};

	const fallbackStatusClasses =
		'bg-muted text-muted-foreground border-muted dark:border-muted-foreground';
	return (
		<Badge
			className={cn(
				statusClasses[value as Statuses] || fallbackStatusClasses,
				className
			)}
		>
			{icon && iconPosition === 'left' && icon}
			{enumToText(label ?? value, allCaps)}
			{icon && iconPosition === 'right' && icon}
			{showChevron && <ChevronDown className='shrink-0' />}
		</Badge>
	);
};
