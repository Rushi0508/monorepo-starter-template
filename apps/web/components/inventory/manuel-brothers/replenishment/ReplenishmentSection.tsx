'use client';

import { tooltips } from '@repo/constants';
import { Button } from '@repo/ui/components/button';
import { InfoIcon, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';
import EmptyMessage from '@/components/general/EmptyMessage';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useReplenishmentOrders } from '@/queries';
import { AddReplenishmentOrderDialog } from './AddReplenishmentOrderDialog';
import { ReplenishmentOrdersTable } from './ReplenishmentOrdersTable';

export const ReplenishmentSection = () => {
	const { data, isLoading } = useReplenishmentOrders();
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<div className='rounded-lg border bg-card overflow-hidden'>
				<div className='border-b px-5 py-4'>
					<h2 className='text-sm flex items-center justify-between'>
						<div className='space-y-1'>
							<div className='flex items-center gap-1.5'>
								<span className='font-semibold'>Replenishment Orders</span>
								<CustomTooltip
									content={tooltips.replenishmentOrders.howItWorks}
								>
									<span className='flex items-center gap-1 text-xs font-normal tracking-tight text-muted-foreground hover:cursor-help'>
										How it works
										<InfoIcon className='size-3 text-muted-foreground' />
									</span>
								</CustomTooltip>
							</div>
							<p className='text-muted-foreground'>
								Orders placed to BlueBox to replenish Manuel Brothers inventory.
							</p>
						</div>
						<Button size='sm' onClick={() => setDialogOpen(true)}>
							<PlusCircle className='size-4' />
							Add Order
						</Button>
					</h2>
				</div>

				{isLoading ? (
					<TableSkeleton rows={3} />
				) : !data || data.length === 0 ? (
					<EmptyMessage
						message='No replenishment orders yet.'
						description='Create a new replenishment order to replenish Manuel Brothers inventory.'
					/>
				) : (
					<ReplenishmentOrdersTable data={data} />
				)}
			</div>

			{dialogOpen && (
				<AddReplenishmentOrderDialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
				/>
			)}
		</>
	);
};
