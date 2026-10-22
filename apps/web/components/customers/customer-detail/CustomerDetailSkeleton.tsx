import { Skeleton } from '@repo/ui/components/skeleton';

const CustomerDetailSkeleton = () => (
	<div className='space-y-6 p-6'>
		<div className='space-y-2'>
			<Skeleton className='h-8 w-52' />
			<Skeleton className='h-4 w-40' />
		</div>
		<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
			{[0, 1, 2].map((i) => (
				<Skeleton key={i} className='h-52 rounded-xl' />
			))}
		</div>
		<Skeleton className='h-80 rounded-xl' />
	</div>
);

export default CustomerDetailSkeleton;
