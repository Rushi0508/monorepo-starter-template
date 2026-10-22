import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';

interface SkletonLoaderProps {
	count?: number;
	className?: string;
}

export const SkletonLoader = ({ count = 3, className }: SkletonLoaderProps) => (
	<div className='space-y-3'>
		{Array.from({ length: count }).map((_, i) => (
			<Skeleton key={i} className={cn('h-8 w-full', className)} />
		))}
	</div>
);
