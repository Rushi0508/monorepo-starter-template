'use client';

import type { AsnItem } from '@repo/types';
import { Truck } from 'lucide-react';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useBlueboxAsns } from '@/queries';
import { AsnDetailSheet } from './AsnDetailSheet';
import { asnCols } from './asn-cols';

const AsnSection = () => {
	const { data, isLoading, error } = useBlueboxAsns();
	const [selectedAsn, setSelectedAsn] = useState<AsnItem | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleRowClick = (row: AsnItem) => {
		setSelectedAsn(row);
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
				<div className='border-b px-5 py-4'>
					<h2 className='text-sm font-semibold'>
						ASNs{' '}
						{data && (
							<span className='text-muted-foreground font-normal'>
								· {data.totalCount} records
							</span>
						)}
					</h2>
				</div>

				<CustomTable<AsnItem>
					data={data?.data ?? []}
					columns={asnCols}
					enableSorting
					enablePagination
					pageSize={10}
					onRowClick={handleRowClick}
					className='rounded-none! border-0!'
					paginationClassName='mt-0 border-t px-5 py-3'
					emptyState={
						<EmptyMessage
							message='No ASNs found'
							description='No Advanced Shipping Notices have been recorded yet.'
							icon={<Truck className='size-8 text-muted-foreground' />}
						/>
					}
				/>
			</div>

			<AsnDetailSheet
				asn={selectedAsn}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
};

export default AsnSection;
