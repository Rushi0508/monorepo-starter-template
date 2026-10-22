'use client';

import { Button } from '@repo/ui/components/button';
import { Factory, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useBlueboxProductionRuns } from '@/queries';
import { AddProductionRunDialog } from './AddProductionRunDialog';
import { productionRunCols } from './production-run-cols';

const ProductionRunSection = () => {
	const { data, isLoading, error } = useBlueboxProductionRuns();
	const [dialogOpen, setDialogOpen] = useState(false);

	if (isLoading) {
		return <TableSkeleton rows={5} />;
	}

	if (error) {
		return <AlertMessage message={error.message} variant='destructive' />;
	}

	return (
		<>
			<div className='rounded-lg border bg-card overflow-hidden'>
				<div className='flex items-center justify-between border-b px-5 py-4 max-h-14'>
					<h2 className='text-sm font-semibold'>
						Production Runs{' '}
						{data && (
							<span className='text-muted-foreground font-normal'>
								· {data.totalCount} records
							</span>
						)}
					</h2>
					<Button
						variant='outline'
						size='sm'
						onClick={() => setDialogOpen(true)}
					>
						<PlusCircle className='size-3.5' />
						Add Run
					</Button>
				</div>

				<CustomTable
					data={data?.data ?? []}
					columns={productionRunCols}
					enableSorting
					enablePagination
					pageSize={10}
					getRowClassName={(run) =>
						run.completedAt ? 'text-muted-foreground opacity-60' : ''
					}
					className='rounded-none! border-0!'
					paginationClassName='mt-0 border-t px-5 py-3'
					emptyState={
						<EmptyMessage
							message='No production runs yet'
							description='Record production runs to track lot numbers and quantities.'
							icon={<Factory className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			</div>

			<AddProductionRunDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
			/>
		</>
	);
};

export default ProductionRunSection;
