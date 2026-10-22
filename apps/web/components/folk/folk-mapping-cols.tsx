'use client';

import { tooltips } from '@repo/constants';
import { FolkMappingStatusEnum } from '@repo/enums';
import type { FolkCompanyMappingType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Ban,
	Check,
	CircleAlert,
	ExternalLink,
	Link2,
	Unlink,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { EnumBadge } from '@/components/general/CustomBadge';
import type { CustomColumnDef } from '@/components/general/CustomTable';
import CustomTooltip from '@/components/general/CustomTooltip';
import { folkCompanyUrl } from '@/utils/get-urls';
import { FOLK_MAPPING_STATUS_STYLES } from '../badge-style-config';

type GetFolkMappingColsOptions = {
	onConfirmProposed: (mapping: FolkCompanyMappingType) => void;
	onDenyProposed: (mapping: FolkCompanyMappingType) => void;
	onPickCustomer: (mapping: FolkCompanyMappingType) => void;
	onUnlinkCustomer: (
		mapping: FolkCompanyMappingType,
		customerId: string
	) => void;
	onUnmap: (mapping: FolkCompanyMappingType) => void;
	isUnlinking: boolean;
};

export function getFolkMappingCols({
	onConfirmProposed,
	onDenyProposed,
	onPickCustomer,
	onUnlinkCustomer,
	onUnmap,
	isUnlinking,
}: GetFolkMappingColsOptions): CustomColumnDef<FolkCompanyMappingType>[] {
	return [
		{
			accessorKey: 'folkCompanyName',
			header: 'Folk company',
			enableSorting: false,
			cell: ({ row }) => (
				<div>
					<a
						href={folkCompanyUrl(
							row.original.folkGroupId,
							row.original.folkCompanyId
						)}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex items-center gap-1 font-medium hover:underline'
						title='Open in Folk'
					>
						{row.original.folkCompanyName}
						<ExternalLink className='size-3 shrink-0 text-muted-foreground' />
					</a>
					<p className='text-xs text-muted-foreground'>
						{row.original.folkCompanyId}
					</p>
				</div>
			),
		},
		{
			accessorKey: 'folkEmail',
			header: 'Folk email',
			enableSorting: false,
			cell: ({ row }) => {
				const { folkEmail, status } = row.original;
				if (folkEmail) return <span className='text-xs'>{folkEmail}</span>;
				if (status === FolkMappingStatusEnum.MAPPED) {
					return <span className='text-muted-foreground'>—</span>;
				}

				return (
					<CustomTooltip content={tooltips.folkMappingPage.emailMissing}>
						<span className='inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'>
							<CircleAlert className='size-3' />
							Email missing
						</span>
					</CustomTooltip>
				);
			},
		},
		{
			accessorKey: 'sdCustomerId',
			header: 'SD Customer ID',
			enableSorting: false,
			cell: ({ row }) => (
				<span className='font-mono text-xs'>
					{row.original.sdCustomerId ?? '—'}
				</span>
			),
		},
		{
			id: 'saueroCustomers',
			header: 'Sauero customers',
			enableSorting: false,
			cell: ({ row }) => {
				const mapping = row.original;
				// The list endpoint always includes them, but the type allows a bare row.
				const customers = mapping.customers ?? [];

				if (customers.length > 0) {
					return (
						<div className='flex flex-wrap gap-1'>
							{customers.map((customer) => (
								<span
									key={customer.id}
									className='inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs'
								>
									{customer.displayName || customer.id}
									<button
										type='button'
										className='text-muted-foreground hover:text-destructive'
										disabled={isUnlinking}
										onClick={() => onUnlinkCustomer(mapping, customer.id)}
										aria-label={`Unlink ${customer.displayName}`}
									>
										<X className='size-3' />
									</button>
								</span>
							))}
						</div>
					);
				}

				if (mapping.proposedCustomer) {
					const score = mapping.matchScore;
					return (
						<div>
							<p>
								{mapping.proposedCustomer.displayName ||
									mapping.proposedCustomer.id}
							</p>
							<p className='text-xs text-muted-foreground'>
								Proposed
								{score != null ? ` · ${Math.round(score * 100)}%` : ''}
							</p>
						</div>
					);
				}

				return <span className='text-muted-foreground'>—</span>;
			},
		},
		{
			id: 'saueroCustomerId',
			header: 'Sauero customer ID',
			enableSorting: false,
			cell: ({ row }) => {
				const customers = row.original.customers ?? [];
				if (customers.length === 0) {
					return <span className='text-muted-foreground'>—</span>;
				}

				return (
					<div className='flex flex-col gap-1'>
						{customers.map((customer) => (
							<Link
								key={customer.id}
								href={`/customers/${customer.id}`}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline'
								title={`Open ${customer.displayName ?? 'customer'}`}
							>
								{customer.saueroCode ?? 'No code'}
								<ExternalLink className='size-3 shrink-0' />
							</Link>
						))}
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: 'Status',
			enableSorting: false,
			cell: ({ row }) => (
				<EnumBadge
					value={row.original.status}
					className={FOLK_MAPPING_STATUS_STYLES[row.original.status]}
				/>
			),
		},
		{
			id: 'actions',
			header: '',
			enableSorting: false,
			cell: ({ row }) => {
				const mapping = row.original;
				const hasMappedCustomers = (mapping.customers ?? []).length > 0;
				const hasProposal =
					mapping.status === FolkMappingStatusEnum.PENDING_REVIEW &&
					Boolean(mapping.proposedCustomer);

				return (
					<div className='flex items-center justify-end gap-1'>
						{hasProposal && (
							<>
								<Button
									size='sm'
									variant='outline'
									onClick={() => onConfirmProposed(mapping)}
								>
									<Check className='size-4' />
									Confirm
								</Button>
								<Button
									size='sm'
									variant='ghost'
									className='text-destructive hover:text-destructive'
									onClick={() => onDenyProposed(mapping)}
								>
									<Ban className='size-4' />
									Deny
								</Button>
							</>
						)}
						<Button
							size='sm'
							variant='ghost'
							onClick={() => onPickCustomer(mapping)}
						>
							<Link2 className='size-4' />
							{hasMappedCustomers ? 'Add' : 'Pick'}
						</Button>
						{mapping.status === FolkMappingStatusEnum.MAPPED && (
							<Button
								size='sm'
								variant='ghost'
								className='text-destructive hover:text-destructive'
								onClick={() => onUnmap(mapping)}
							>
								<Unlink className='size-4' />
								UnMap
							</Button>
						)}
					</div>
				);
			},
		},
	];
}
