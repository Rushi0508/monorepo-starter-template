'use client';

import { Package2 } from 'lucide-react';
import AlertMessage from '@/components/general/AlertMessage';
import EmptyMessage from '@/components/general/EmptyMessage';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useManuelBrothersInventory } from '@/queries';
import { SkuTable } from './SkuTable';

const SkuSection = () => {
	const { data, isLoading, error } = useManuelBrothersInventory();

	if (isLoading) {
		return <TableSkeleton rows={8} />;
	}

	if (error) {
		return <AlertMessage message={error.message} variant='destructive' />;
	}

	if (!data || data.length === 0) {
		return (
			<div className='rounded-lg border bg-card'>
				<div className='border-b px-5 py-4'>
					<h2 className='text-sm font-semibold'>SKU Positions</h2>
				</div>

				<div className='p-8'>
					<EmptyMessage
						message='No SKUs found'
						description='No inventory data is available yet. Data syncs every 4 hours.'
						icon={<Package2 className='size-8 text-muted-foreground' />}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className='rounded-lg border bg-card overflow-hidden'>
			<div className='border-b px-5 py-4'>
				<h2 className='text-sm font-semibold'>
					SKU Positions{' '}
					<span className='text-muted-foreground font-normal'>
						· {data.length} SKUs
					</span>
				</h2>
			</div>

			<SkuTable data={data} />
		</div>
	);
};

export default SkuSection;
