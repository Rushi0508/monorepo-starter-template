'use client';

import { ASNStatusEnum } from '@repo/enums/dist';
import type { AsnItem, AsnPackage } from '@repo/types';
import { Separator } from '@repo/ui/components/separator';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { Box, CalendarDays, Hash, Truck } from 'lucide-react';
import { ASN_STYLES } from '@/components/badge-style-config';
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

// ─── package table ─────────────────────────────────────────────────────────────

const PackageTable = ({ packages }: { packages: AsnPackage[] }) => {
	if (packages.length === 0)
		return <p className='text-sm text-muted-foreground'>No packages.</p>;

	return (
		<div className='rounded-lg border overflow-hidden'>
			<table className='w-full text-sm'>
				<thead className='bg-muted'>
					<tr>
						{['SKU', 'Lot', 'Sent', 'Received', 'Damaged', 'Shelved'].map(
							(h) => (
								<th
									key={h}
									className='px-3 py-2 text-left font-semibold text-primary whitespace-nowrap'
								>
									{h}
								</th>
							)
						)}
					</tr>
				</thead>
				<tbody>
					{packages.map((pkg, i) => (
						<tr key={pkg.id} className={cn(i % 2 === 0 ? '' : 'bg-muted/30')}>
							<td className='px-3 py-2 font-medium'>{pkg.sku ?? '—'}</td>
							<td className='px-3 py-2 text-muted-foreground'>
								{pkg.lot ?? '—'}
							</td>
							<td className='px-3 py-2'>{pkg.quantitySent.toLocaleString()}</td>
							<td className='px-3 py-2 text-emerald-600 font-medium'>
								{pkg.quantityReceived.toLocaleString()}
							</td>
							<td className='px-3 py-2'>
								<span
									className={
										pkg.quantityDamaged > 0
											? 'text-red-600 font-medium'
											: 'text-muted-foreground'
									}
								>
									{pkg.quantityDamaged > 0
										? pkg.quantityDamaged.toLocaleString()
										: '—'}
								</span>
							</td>
							<td className='px-3 py-2'>
								{pkg.quantityShelved.toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

// ─── main component ────────────────────────────────────────────────────────────

interface AsnDetailSheetProps {
	asn: AsnItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const AsnDetailSheet = ({
	asn,
	open,
	onOpenChange,
}: AsnDetailSheetProps) => {
	if (!asn) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-2xl overflow-y-auto'>
				<SheetHeader className='pb-4 mt-4'>
					<div className='flex items-center justify-between gap-4 flex-wrap'>
						<SheetTitle className='text-xl'>{asn.asnNumber}</SheetTitle>
						<EnumBadge
							value={asn.status as ASNStatusEnum}
							className={cn(ASN_STYLES[asn.status as ASNStatusEnum])}
							allCaps
						/>
					</div>
					{asn.description && (
						<p className='text-sm text-muted-foreground'>{asn.description}</p>
					)}
				</SheetHeader>

				<div className='px-3'>
					{/* ── Identifiers ── */}
					<div className='space-y-1 rounded-lg border p-4 mb-5'>
						<div className='flex items-center gap-2 mb-2'>
							<Hash className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Identifiers</span>
						</div>
						<MetaRow label='PO Number' value={asn.poNumber} />
						<MetaRow label='SKU' value={asn.sku} />
						<MetaRow label='External ID' value={asn.externalId} />
						<MetaRow label='Warehouse' value={asn.warehouseCode} />
					</div>

					{/* ── Shipping ── */}
					<div className='space-y-1 rounded-lg border p-4 mb-5'>
						<div className='flex items-center gap-2 mb-2'>
							<Truck className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Shipping</span>
						</div>
						<MetaRow label='Carrier' value={asn.carrier} />
						<MetaRow label='Tracking' value={asn.trackingNumber} />
					</div>

					{/* ── Dates ── */}
					<div className='space-y-1 rounded-lg border p-4 mb-5'>
						<div className='flex items-center gap-2 mb-2'>
							<CalendarDays className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>Dates</span>
						</div>
						<MetaRow label='Expected' value={formatDate(asn.expectedDate)} />
						<MetaRow label='Arrived' value={formatDate(asn.actualDate)} />
					</div>

					{/* ── Quantities ── */}
					<div className='grid grid-cols-4 gap-3 mb-5'>
						{[
							{ label: 'Sent', value: asn.sent, className: '' },
							{
								label: 'Received',
								value: asn.received,
								className: 'text-emerald-600',
							},
							{
								label: 'Damaged',
								value: asn.damaged,
								className: asn.damaged > 0 ? 'text-red-600' : '',
							},
							{ label: 'Shelved', value: asn.shelved, className: '' },
						].map(({ label, value, className }) => (
							<div key={label} className='rounded-lg border p-3 text-center'>
								<p className='text-xs text-muted-foreground mb-1'>{label}</p>
								<p className={cn('text-lg font-bold', className)}>
									{value.toLocaleString()}
								</p>
							</div>
						))}
					</div>

					{/* ── Packages ── */}
					<div className='mb-5'>
						<div className='flex items-center gap-2 mb-3'>
							<Box className='size-4 text-muted-foreground' />
							<span className='text-sm font-semibold'>
								Packages{' '}
								<span className='text-muted-foreground font-normal'>
									({asn.packages.length})
								</span>
							</span>
						</div>
						<PackageTable packages={asn.packages} />
					</div>

					{/* ── Notes ── */}
					{asn.notes && (
						<>
							<Separator className='my-4' />
							<div>
								<p className='text-sm font-semibold mb-1'>Notes</p>
								<p className='text-sm text-muted-foreground whitespace-pre-wrap'>
									{asn.notes}
								</p>
							</div>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};
