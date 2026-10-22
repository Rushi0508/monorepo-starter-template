'use client';

import type { KitOrderItem } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Boxes, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useBlueboxKitOrders } from '@/queries';
import { blueboxKitOrdersUrl } from '@/utils/get-urls';
import { KitOrderDetailSheet } from './KitOrderDetailSheet';
import { kitOrderCols } from './kit-order-cols';

const KitOrderSection = () => {
	const { data, isLoading, error } = useBlueboxKitOrders();
	const [selectedKitOrder, setSelectedKitOrder] = useState<KitOrderItem | null>(
		null
	);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleRowClick = (row: KitOrderItem) => {
		setSelectedKitOrder(row);
		setSheetOpen(true);
	};

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
						Kitting Orders{' '}
						{data && (
							<span className='text-muted-foreground font-normal'>
								· {data.totalCount} records
							</span>
						)}
					</h2>
					<Button variant='outline' size='sm' asChild>
						<a
							href={blueboxKitOrdersUrl()}
							target='_blank'
							rel='noopener noreferrer'
						>
							Open in BlueBox
							<ExternalLink className='size-3.5' />
						</a>
					</Button>
				</div>

				<CustomTable<KitOrderItem>
					data={data?.data ?? []}
					columns={kitOrderCols}
					enableSorting
					enablePagination
					pageSize={10}
					onRowClick={handleRowClick}
					className='rounded-none! border-0!'
					paginationClassName='mt-0 border-t px-5 py-3'
					emptyState={
						<EmptyMessage
							message='No kitting orders found'
							description='Kitting orders placed in iDrive will show up here after the next sync.'
							icon={<Boxes className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			</div>

			<KitOrderDetailSheet
				kitOrder={selectedKitOrder}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
};

export default KitOrderSection;
