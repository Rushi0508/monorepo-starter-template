import { cn } from '@repo/ui/lib/utils';
import CustomTooltip from '@/components/general/CustomTooltip';

interface KpiCardProps {
	label: string;
	value: string;
	hint?: string;
	tooltip?: string;
	valueClassName?: string;
}

export function KpiCard({
	label,
	value,
	hint,
	tooltip,
	valueClassName,
}: KpiCardProps) {
	return (
		<div className='flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-xs'>
			<p className='flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
				{label}
				{tooltip && <CustomTooltip content={tooltip} />}
			</p>
			<p className={cn('text-2xl font-bold tabular-nums', valueClassName)}>
				{value}
			</p>
			{hint && (
				<p className='text-xs text-muted-foreground leading-snug'>{hint}</p>
			)}
		</div>
	);
}

export function KpiCardSkeleton() {
	return (
		<div className='flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs'>
			<div className='h-3 w-20 animate-pulse rounded bg-muted' />
			<div className='h-7 w-24 animate-pulse rounded bg-muted' />
			<div className='h-3 w-32 animate-pulse rounded bg-muted' />
		</div>
	);
}
