import { Skeleton } from '@repo/ui/components/skeleton';

export const ForecastAccuracySkeleton = () => (
	<div className='space-y-4'>
		<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
			<Skeleton className='h-25 w-full rounded-xl' />
			<Skeleton className='h-25 w-full rounded-xl' />
			<Skeleton className='h-25 w-full rounded-xl' />
			<Skeleton className='h-25 w-full rounded-xl' />
		</div>
		<Skeleton className='h-85 w-full rounded-xl' />
		<div className='grid gap-4 lg:grid-cols-2'>
			<Skeleton className='h-72 w-full rounded-xl' />
			<Skeleton className='h-72 w-full rounded-xl' />
		</div>
		<Skeleton className='h-96 w-full rounded-xl' />
	</div>
);
