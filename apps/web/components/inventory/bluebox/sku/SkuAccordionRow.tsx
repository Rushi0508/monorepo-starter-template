'use client';

import type {
	InProductionBreakdown,
	InProductionSource,
	InventoryLot,
	InventorySkuRow,
} from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';

const formatQty = (n: number) => n.toLocaleString();

// ─── lot sub-table ─────────────────────────────────────────────────────────────

const LotTable = ({ lots }: { lots: InventoryLot[] }) => {
	if (lots.length === 0)
		return (
			<p className='pl-8 py-2.5 text-xs text-muted-foreground italic'>
				No lot data available.
			</p>
		);

	return (
		<table className='w-full text-xs'>
			<thead>
				<tr className='border-b bg-muted/30'>
					<th className='w-8' />
					{['LOT', 'LOCATION', 'CASES', 'EXPIRES', 'DAYS TO EXPIRY'].map(
						(h) => (
							<th
								key={h}
								className='px-3 py-1.5 text-left font-semibold tracking-wide text-muted-foreground'
							>
								{h}
							</th>
						)
					)}
				</tr>
			</thead>
			<tbody>
				{lots.map((lot, i) => (
					<tr
						key={`${lot.lotNumber}-${i}`}
						className={cn(
							'border-b last:border-0',
							i % 2 === 1 ? 'bg-muted/10' : ''
						)}
					>
						<td className='w-8' />
						<td className='px-3 py-2 font-medium'>{lot.lotNumber || '—'}</td>
						<td className='px-3 py-2 text-muted-foreground'>
							{lot.location || '—'}
						</td>
						<td className='px-3 py-2'>{lot.qty.toLocaleString()}</td>
						<td className='px-3 py-2 text-muted-foreground'>
							{lot.expirationDate
								? format(new Date(lot.expirationDate), 'MMM d, yyyy')
								: '—'}
						</td>
						<td className='px-3 py-2'>
							{lot.daysToExpiry != null ? (
								<span
									className={cn(
										'font-semibold',
										lot.daysToExpiry <= 90
											? 'text-red-600'
											: lot.daysToExpiry <= 180
												? 'text-yellow-600'
												: ''
									)}
								>
									{lot.daysToExpiry}d
								</span>
							) : (
								'—'
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

// ─── in production ─────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<InProductionSource['type'], string> = {
	run: 'Production run',
	asn: 'Inbound ASN',
	kit: 'Kitting order',
};

const InProductionBreakdownTooltip = ({
	breakdown,
}: {
	breakdown: InProductionBreakdown;
}) => (
	<div className='space-y-0.5 text-xs'>
		{[
			{ label: 'Production runs', value: breakdown.runs },
			{ label: 'Inbound ASNs', value: breakdown.asns },
			{ label: 'Kitting orders', value: breakdown.kitting },
		].map(({ label, value }) => (
			<div key={label} className='flex justify-between gap-6'>
				<span>{label}</span>
				<span className='font-semibold'>{formatQty(value)}</span>
			</div>
		))}
	</div>
);

const InProductionTable = ({ sources }: { sources: InProductionSource[] }) => (
	<table className='w-full text-xs border-t'>
		<thead>
			<tr className='border-b bg-muted/30'>
				<th className='w-8' />
				{['IN PRODUCTION', 'REFERENCE', 'LOT', 'QUANTITY', 'EXPECTED'].map(
					(h) => (
						<th
							key={h}
							className='px-3 py-1.5 text-left font-semibold tracking-wide text-muted-foreground'
						>
							{h}
						</th>
					)
				)}
			</tr>
		</thead>
		<tbody>
			{sources.map((source, i) => (
				<tr
					key={`${source.reference}-${source.lot}-${i}`}
					className={cn(
						'border-b last:border-0',
						i % 2 === 1 ? 'bg-muted/10' : ''
					)}
				>
					<td className='w-8' />
					<td className='px-3 py-2 text-muted-foreground'>
						{SOURCE_LABELS[source.type]}
					</td>
					<td className='px-3 py-2 font-medium'>{source.reference}</td>
					<td className='px-3 py-2 text-muted-foreground'>
						{source.lot || '—'}
					</td>
					<td className='px-3 py-2'>{formatQty(source.quantity)}</td>
					<td className='px-3 py-2 text-muted-foreground'>
						{source.date ? format(new Date(source.date), 'MMM d, yyyy') : '—'}
					</td>
				</tr>
			))}
		</tbody>
	</table>
);

// ─── single SKU row ────────────────────────────────────────────────────────────

interface SkuAccordionRowProps {
	row: InventorySkuRow;
	gridTemplate: string;
}

export const SkuAccordionRow = ({
	row,
	gridTemplate,
}: SkuAccordionRowProps) => {
	const [open, setOpen] = useState(false);

	const earliestExpiry = row.lots.find((l) => l.expirationDate != null);

	return (
		<div
			className={cn(
				'border-b last:border-0 transition-colors',
				open ? 'bg-muted/10' : 'hover:bg-muted/20'
			)}
		>
			{/* ── collapsed row ── */}
			<button
				type='button'
				className='w-full text-left'
				onClick={() => setOpen((v) => !v)}
			>
				<div
					className='grid items-center gap-3 px-3 py-2.5'
					style={{ gridTemplateColumns: gridTemplate }}
				>
					{/* expand icon */}
					<span className='text-muted-foreground'>
						{open ? (
							<ChevronDown className='size-3.5' />
						) : (
							<ChevronRight className='size-3.5' />
						)}
					</span>

					{/* SKU name + code */}
					<div className='min-w-0'>
						<p className='text-sm font-medium leading-tight truncate'>
							{row.description ?? row.sku}
						</p>
						<p className='text-[11px] text-muted-foreground mt-0.5'>
							{row.sku}
						</p>
					</div>

					{/* In Production */}
					<div className='flex justify-end'>
						{row.inProduction.total > 0 ? (
							<CustomTooltip
								content={
									<InProductionBreakdownTooltip breakdown={row.inProduction} />
								}
								delayDuration={150}
							>
								<span className='text-xs font-medium text-orange-600 underline decoration-dotted underline-offset-2'>
									{formatQty(row.inProduction.total)}
								</span>
							</CustomTooltip>
						) : (
							<span className='text-xs text-foreground/80'>—</span>
						)}
					</div>

					{/* On Hand */}
					<p className='text-right text-sm font-semibold'>
						{formatQty(row.onHand)}
					</p>

					{/* Committed */}
					<p className='text-right text-xs text-foreground/80'>
						{row.committed > 0 ? formatQty(row.committed) : '—'}
					</p>

					{/* Available */}
					<p className='text-right text-sm font-semibold text-emerald-600'>
						{formatQty(row.available)}
					</p>

					{/* Backordered */}
					<p
						className={cn(
							'text-right text-xs',
							row.backordered > 0
								? 'text-red-600 font-medium'
								: 'text-foreground/80'
						)}
					>
						{row.backordered > 0 ? formatQty(row.backordered) : '—'}
					</p>

					{/* Quarantined */}
					<p
						className={cn(
							'text-right text-xs',
							row.quarantined > 0
								? 'text-yellow-600 font-medium'
								: 'text-foreground/80'
						)}
					>
						{row.quarantined > 0 ? formatQty(row.quarantined) : '—'}
					</p>
				</div>
			</button>

			{/* ── expanded lot section ── */}
			{open && (
				<div className='border-t ml-5 border-l-2 border-l-primary/20 bg-muted/5'>
					{earliestExpiry && (
						<div className='flex items-center gap-5 px-4 py-1.5 text-[11px] text-muted-foreground bg-muted/20 border-b'>
							<span>
								Earliest expiry ·{' '}
								<span className='font-medium text-foreground'>
									{earliestExpiry.lotNumber}
								</span>
								{earliestExpiry.daysToExpiry != null && (
									<span
										className={cn(
											'ml-1 font-semibold',
											earliestExpiry.daysToExpiry <= 90
												? 'text-red-600'
												: 'text-yellow-600'
										)}
									>
										· {earliestExpiry.daysToExpiry}d
									</span>
								)}
							</span>
						</div>
					)}
					<LotTable lots={row.lots} />
					{row.inProduction.sources.length > 0 && (
						<InProductionTable sources={row.inProduction.sources} />
					)}
				</div>
			)}
		</div>
	);
};
