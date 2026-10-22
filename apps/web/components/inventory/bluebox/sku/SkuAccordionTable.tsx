'use client';

import { tooltips } from '@repo/constants';
import type { InventorySkuRow, InventoryTotals } from '@repo/types';
import CustomTooltip from '@/components/general/CustomTooltip';
import { SkuAccordionRow } from './SkuAccordionRow';

// ─── column header row ─────────────────────────────────────────────────────────

const inv = tooltips.inventoryPage;

const HEADERS: {
	label: string;
	width: string;
	align?: string;
	tooltip?: string;
}[] = [
	{ label: '', width: '20px' },
	{ label: 'SKU', width: '1fr', align: 'left' },
	{
		label: 'IN PRODUCTION',
		width: '120px',
		align: 'right',
		tooltip: inv.inProduction,
	},
	{ label: 'ON HAND', width: '100px', align: 'right', tooltip: inv.onHand },
	{
		label: 'COMMITTED',
		width: '100px',
		align: 'right',
		tooltip: inv.committed,
	},
	{
		label: 'AVAILABLE',
		width: '100px',
		align: 'right',
		tooltip: inv.available,
	},
	{
		label: 'BACKORDERED',
		width: '110px',
		align: 'right',
		tooltip: inv.backordered,
	},
	{
		label: 'QUARANTINED',
		width: '110px',
		align: 'right',
		tooltip: inv.quarantined,
	},
];

const GRID_TEMPLATE = HEADERS.map((h) => h.width).join(' ');

const HeaderRow = () => (
	<div
		className='grid items-center gap-3 px-3 py-2 bg-muted border-b'
		style={{ gridTemplateColumns: GRID_TEMPLATE }}
	>
		{HEADERS.map(({ label, align, tooltip }) => (
			<span
				key={label}
				className={`text-[11px] font-semibold tracking-wide text-muted-foreground flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}
			>
				{label}
				{tooltip && <CustomTooltip content={tooltip} />}
			</span>
		))}
	</div>
);

// ─── totals row ────────────────────────────────────────────────────────────────

const TotalsRow = ({ totals }: { totals: InventoryTotals }) => (
	<div
		className='grid items-center gap-3 px-3 py-2.5 border-t bg-muted/40 font-semibold'
		style={{ gridTemplateColumns: GRID_TEMPLATE }}
	>
		<span />
		<span className='text-xs'>TOTALS</span>
		<span className='text-right text-xs'>
			{totals.inProduction > 0 ? totals.inProduction.toLocaleString() : '—'}
		</span>
		<span className='text-right text-xs'>{totals.onHand.toLocaleString()}</span>
		<span className='text-right text-xs'>
			{totals.committed.toLocaleString()}
		</span>
		<span className='text-right text-xs'>
			{totals.available.toLocaleString()}
		</span>
		<span className='text-right text-xs'>
			{totals.backordered > 0 ? totals.backordered.toLocaleString() : '—'}
		</span>
		<span className='text-right text-xs'>
			{totals.quarantined > 0 ? totals.quarantined.toLocaleString() : '—'}
		</span>
	</div>
);

// ─── main table ────────────────────────────────────────────────────────────────

interface SkuAccordionTableProps {
	data: InventorySkuRow[];
	totals: InventoryTotals;
}

export const SkuAccordionTable = ({ data, totals }: SkuAccordionTableProps) => {
	if (data.length === 0) {
		return (
			<div className='rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground'>
				No SKU data available.
			</div>
		);
	}

	return (
		<div>
			<HeaderRow />
			{data.map((row) => (
				<SkuAccordionRow key={row.sku} row={row} gridTemplate={GRID_TEMPLATE} />
			))}
			<TotalsRow totals={totals} />
		</div>
	);
};
