import { Skeleton } from '@repo/ui/components/skeleton';

interface TableSkeletonProps {
	rows?: number;
}

const TableSkeleton = ({ rows = 6 }: TableSkeletonProps) => {
	return (
		<div className='space-y-2 rounded-xl border p-4'>
			{Array.from({ length: rows }).map((_, i) => (
				<Skeleton key={i} className='h-12 w-full' />
			))}
		</div>
	);
};

export default TableSkeleton;
