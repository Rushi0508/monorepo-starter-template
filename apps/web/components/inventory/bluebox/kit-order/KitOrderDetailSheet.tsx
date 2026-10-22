'use client';

import type {
	KitOrderFinalItem,
	KitOrderItem,
	KitOrderRawItem,
} from '@repo/types';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { Boxes, CalendarDays, Hash, PackageCheck } from 'lucide-react';
import { KIT_ORDER_STYLES } from '@/components/badge-style-config';
import { EnumBadge } from '@/components/general/CustomBadge';

const formatDate = (iso: string | null) =>
	iso ? format(new Date(iso), 'MMM d, yyyy') : '—';

const MetaRow = ({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) => (
	<div className='flex items-start justify-between gap-4 py-1.5'>
		<span className='text-sm text-muted-foreground shrink-0'>{label}</span>
		<span className='text-sm font-medium text-right'>{value || '—'}</span>
	</div>
);

const ItemTable = <T extends { id: string }>({
	items,
	headers,
	renderRow,
	emptyMessage,
}: {
	items: T[];
	headers: string[];
	renderRow: (item: T) => React.ReactNode;
	emptyMessage: string;
}) => {
	if (items.length === 0)
		return <p className='text-sm text-muted-foreground'>{emptyMessage}</p>;

	return (
		<div className='rounded-lg border overflow-hidden'>
			<table className='w-full text-sm'>
				<thead className='bg-muted'>
					<tr>
						{headers.map((h) => (
							<th
								key={h}
								className='px-3 py-2 text-left font-semibold text-primary whitespace-nowrap'
							>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{items.map((item, i) => (
						<tr key={item.id} className={cn(i % 2 === 0 ? '' : 'bg-muted/30')}>
							{renderRow(item)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

const SkuCell = ({
	sku,
	description,
}: {
	sku: string;
	description: string | null;
}) => (
	<td className='px-3 py-2'>
		<p className='font-medium'>{sku}</p>
		{description && (
			<p className='text-xs text-muted-foreground'>{description}</p>
		)}
	</td>
);

interface KitOrderDetailSheetProps {
	kitOrder: KitOrderItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const KitOrderDetailSheet = ({
	kitOrder,
	open,
	onOpenChange,
}: KitOrderDetailSheetProps) => {
	if (!kitOrder) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-2xl overflow-y-auto'>
				<SheetHeader className='pb-4 mt-4'>
					<div className='flex items-center justify-between gap-4 flex-wrap'>
						<SheetTitle className='text-xl'>
							Kit #{kitOrder.kitOrderNumber}
						</SheetTitle>
						<EnumBadge
							value={kitOrder.status}
							className={cn(KIT_ORDER_STYLES[kitOrder.status])}
							allCaps
						/>
					</div>
					{kitOrder.kitDescription && (
						<p className='text-sm text-muted-foreground'>
							{kitOrder.kitDescription}
						</p>
					)}
				</SheetHeader>

				<div className='px-3'>
					<div className='space-y-1 rounded-lg border p-4 mb-5'>
						<div className='flex items-center gap-2 mb-2'>
							<Hash className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Details</span>
						</div>
						<MetaRow label='SKU' value={kitOrder.sku} />
						<MetaRow label='Workflow step' value={kitOrder.workflowStep} />
						<MetaRow label='Warehouse' value={kitOrder.warehouse} />
					</div>

					<div className='space-y-1 rounded-lg border p-4 mb-5'>
						<div className='flex items-center gap-2 mb-2'>
							<CalendarDays className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Dates</span>
						</div>
						<MetaRow label='Created' value={formatDate(kitOrder.createdDate)} />
						<MetaRow
							label='Requested'
							value={formatDate(kitOrder.requestedDate)}
						/>
						{kitOrder.canceledDate ? (
							<MetaRow
								label='Canceled'
								value={formatDate(kitOrder.canceledDate)}
							/>
						) : (
							<MetaRow
								label='Completed'
								value={formatDate(kitOrder.completedDate)}
							/>
						)}
					</div>

					<div className='grid grid-cols-4 gap-3 mb-5'>
						{[
							{ label: 'Ordered', value: kitOrder.quantity.toLocaleString() },
							{
								label: 'Built',
								value: kitOrder.quantityBuilt.toLocaleString(),
								className: 'text-emerald-600',
							},
							{
								label: 'Complete',
								value: `${Math.round(kitOrder.percentComplete)}%`,
							},
							{
								label: 'Billable cost',
								value:
									kitOrder.billableCost != null
										? `$${kitOrder.billableCost.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}`
										: '—',
							},
						].map(({ label, value, className }) => (
							<div key={label} className='rounded-lg border p-3 text-center'>
								<p className='text-xs text-muted-foreground mb-1'>{label}</p>
								<p className={cn('text-lg font-bold', className)}>{value}</p>
							</div>
						))}
					</div>

					<div className='mb-5'>
						<div className='flex items-center gap-2 mb-3'>
							<PackageCheck className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Final items</span>
						</div>
						<ItemTable<KitOrderFinalItem>
							items={kitOrder.finalItems}
							headers={['SKU', 'Ordered', 'Built']}
							emptyMessage='No final items.'
							renderRow={(item) => (
								<>
									<SkuCell sku={item.sku} description={item.description} />
									<td className='px-3 py-2'>
										{item.quantity.toLocaleString()}
									</td>
									<td className='px-3 py-2 text-emerald-600 font-medium'>
										{item.quantityBuilt.toLocaleString()}
									</td>
								</>
							)}
						/>
					</div>

					<div className='mb-5'>
						<div className='flex items-center gap-2 mb-3'>
							<Boxes className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>
								Components{' '}
								<span className='text-muted-foreground font-normal'>
									({kitOrder.rawItems.length})
								</span>
							</span>
						</div>
						<ItemTable<KitOrderRawItem>
							items={kitOrder.rawItems}
							headers={['SKU', 'Required', 'Reserved', 'Consumed', 'Lot']}
							emptyMessage='No components.'
							renderRow={(item) => (
								<>
									<SkuCell sku={item.sku} description={item.description} />
									<td className='px-3 py-2'>
										{item.quantity.toLocaleString()}
									</td>
									<td className='px-3 py-2'>
										{item.quantityReserved.toLocaleString()}
									</td>
									<td className='px-3 py-2'>
										{item.quantityConsumed.toLocaleString()}
									</td>
									<td className='px-3 py-2 text-muted-foreground'>
										{item.requiredLotNumber ?? '—'}
									</td>
								</>
							)}
						/>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
