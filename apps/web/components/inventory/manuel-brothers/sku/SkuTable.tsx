'use client';

import type { InventoryLocationType } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';

const formatQty = (n: number) => n.toLocaleString();

const HEADERS = [
	{ label: 'SKU', align: 'left' },
	{ label: 'On Hand', align: 'right' },
	{ label: 'Available', align: 'right' },
	{ label: 'Committed', align: 'right' },
	{ label: 'Incoming', align: 'right' },
	{ label: 'Damaged', align: 'right' },
] as const;

interface SkuTableProps {
	data: InventoryLocationType[];
}

export const SkuTable = ({ data }: SkuTableProps) => (
	<table className='w-full text-sm'>
		<thead>
			<tr className='border-b bg-muted'>
				{HEADERS.map((h) => (
					<th
						key={h.label}
						className={cn(
							'px-4 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground',
							h.align === 'right' ? 'text-right' : 'text-left'
						)}
					>
						{h.label.toUpperCase()}
					</th>
				))}
			</tr>
		</thead>
		<tbody>
			{data.map((row, i) => (
				<tr
					key={row.sku}
					className={cn(
						'border-b last:border-0',
						i % 2 === 1 ? 'bg-muted/10' : ''
					)}
				>
					<td className='px-4 py-2.5'>
						<p className='font-medium leading-tight'>
							{row.description ?? row.sku}
						</p>
						{row.description && (
							<p className='text-[11px] text-muted-foreground mt-0.5'>
								{row.sku}
							</p>
						)}
					</td>
					<td className='px-4 py-2.5 text-right font-semibold'>
						{formatQty(row.onHand)}
					</td>
					<td className='px-4 py-2.5 text-right font-semibold text-emerald-600'>
						{formatQty(row.available)}
					</td>
					<td className='px-4 py-2.5 text-right text-foreground/80'>
						{row.committed > 0 ? formatQty(row.committed) : '—'}
					</td>
					<td className='px-4 py-2.5 text-right text-foreground/80'>
						{row.incoming > 0 ? formatQty(row.incoming) : '—'}
					</td>
					<td className='px-4 py-2.5 text-right text-foreground/80'>
						{row.damaged > 0 ? formatQty(row.damaged) : '—'}
					</td>
				</tr>
			))}
		</tbody>
		<tfoot>
			<tr className='border-t bg-muted/40 font-semibold text-xs'>
				<td className='px-4 py-2.5'>TOTALS</td>
				<td className='px-4 py-2.5 text-right'>
					{formatQty(data.reduce((acc, row) => acc + row.onHand, 0))}
				</td>
				<td className='px-4 py-2.5 text-right'>
					{formatQty(data.reduce((acc, row) => acc + row.available, 0))}
				</td>
				<td className='px-4 py-2.5 text-right'>
					{formatQty(data.reduce((acc, row) => acc + row.committed, 0))}
				</td>
				<td className='px-4 py-2.5 text-right'>
					{formatQty(data.reduce((acc, row) => acc + row.incoming, 0))}
				</td>
				<td className='px-4 py-2.5 text-right'>
					{formatQty(data.reduce((acc, row) => acc + row.damaged, 0))}
				</td>
			</tr>
		</tfoot>
	</table>
);
