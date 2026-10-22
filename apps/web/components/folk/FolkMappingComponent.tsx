'use client';

import { FolkMappingStatusEnum } from '@repo/enums';
import type {
	FolkCompanyMappingType,
	FolkMappingFilterType,
} from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { CustomTable } from '@/components/general/CustomTable';
import EmptyMessage from '@/components/general/EmptyMessage';
import LoadingButton from '@/components/general/LoadingButton';
import { PageHeader } from '@/components/general/PageHeader';
import Searchbar from '@/components/Searchbar';
import TableSkeleton from '@/components/skeletons/TableSkeleton';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import {
	useDenyFolkProposal,
	useFolkMappingSummary,
	useFolkMappings,
	useFolkPreflight,
	useLinkFolkCustomer,
	useSeedFolkMappings,
	useUnlinkFolkCustomer,
	useUnmapFolkCompany,
} from '@/queries';
import FolkCustomerPickerDialog from './FolkCustomerPickerDialog';
import { getFolkMappingCols } from './folk-mapping-cols';

const STATUS_FILTERS: { value?: FolkMappingStatusEnum; label: string }[] = [
	{ label: 'All' },
	{ value: FolkMappingStatusEnum.PENDING_REVIEW, label: 'Pending' },
	{ value: FolkMappingStatusEnum.MAPPED, label: 'Mapped' },
	{ value: FolkMappingStatusEnum.UNMAPPED, label: 'Unmapped' },
];

const EMPTY_FILTERS: FolkMappingFilterType = {
	search: '',
	page: 1,
	limit: 20,
};

const FolkMappingComponent = () => {
	const { filters, setFilters } =
		useQueryFilters<FolkMappingFilterType>(EMPTY_FILTERS);
	const [debouncedSearch] = useDebounce(filters.search, 400);

	const listFilters = { ...filters, search: debouncedSearch };
	const { data, isLoading, error } = useFolkMappings(listFilters);
	const { data: summary } = useFolkMappingSummary();
	const { mutate: seed, isPending: isSeeding } = useSeedFolkMappings();
	const { mutate: preflight, isPending: isPreflighting } = useFolkPreflight();
	const { mutate: linkCustomer, isPending: isLinking } = useLinkFolkCustomer();
	const { mutate: unlinkCustomer, isPending: isUnlinking } =
		useUnlinkFolkCustomer();
	const { mutate: unmap, isPending: isUnmapping } = useUnmapFolkCompany();
	const { mutate: deny, isPending: isDenying } = useDenyFolkProposal();

	const [action, setAction] = useState<{
		type: 'pick' | 'unmap' | 'confirm' | 'deny';
		mapping: FolkCompanyMappingType;
	} | null>(null);

	const closeAction = () => setAction(null);

	const columns = useMemo(
		() =>
			getFolkMappingCols({
				onConfirmProposed: (mapping) => setAction({ type: 'confirm', mapping }),
				onDenyProposed: (mapping) => setAction({ type: 'deny', mapping }),
				onPickCustomer: (mapping) => setAction({ type: 'pick', mapping }),
				onUnlinkCustomer: (mapping, customerId) =>
					unlinkCustomer({ id: mapping.id, customerId }),
				onUnmap: (mapping) => setAction({ type: 'unmap', mapping }),
				isUnlinking,
			}),
		[unlinkCustomer, isUnlinking]
	);

	const companyName = action?.mapping.folkCompanyName ?? 'This company';
	const proposedName =
		action?.mapping.proposedCustomer?.displayName ?? 'the proposed customer';

	return (
		<div className='relative space-y-6'>
			{isSeeding && (
				<div
					className='fixed inset-0 z-50 flex h-dvh w-screen flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-sm'
					role='status'
					aria-live='polite'
					aria-busy='true'
				>
					<Loader2 className='size-10 animate-spin text-muted-foreground' />
					<p className='text-lg font-medium'>Seeding from Folk…</p>
					<p className='text-sm text-muted-foreground'>
						Mapping actions are paused until this finishes.
					</p>
				</div>
			)}

			<PageHeader
				title='Folk mapping'
				description='Review Folk companies against Sauero customers. One Folk company can map to many customers (chains). SD Customer ID is shown for confirmation — Sauero never writes it.'
				actions={
					<div className='flex flex-wrap items-center gap-2'>
						<LoadingButton
							size='sm'
							variant='outline'
							isLoading={isPreflighting}
							disabled={isSeeding || isPreflighting}
							onClick={() => preflight()}
						>
							Field preflight
						</LoadingButton>
						<LoadingButton
							size='sm'
							isLoading={isSeeding}
							disabled={isSeeding}
							onClick={() => seed()}
						>
							<RefreshCw className='size-4' />
							Seed from Folk
						</LoadingButton>
					</div>
				}
			/>

			<div className='flex items-center justify-between'>
				<div className='w-full max-w-sm'>
					<Searchbar
						onChange={(value) =>
							setFilters({ ...filters, search: value, page: 1 })
						}
						value={filters.search ?? ''}
						placeholder='Search Folk company or SD Customer ID...'
					/>
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					{STATUS_FILTERS.map((item) => {
						const count =
							item.value && summary ? summary[item.value] : summary?.total;
						const active = filters.status === item.value;
						return (
							<Button
								key={item.label}
								size='sm'
								variant={active ? 'default' : 'outline'}
								onClick={() =>
									setFilters({ ...filters, status: item.value, page: 1 })
								}
							>
								{item.label}
								{typeof count === 'number' && (
									<span
										className={cn(
											'ml-1.5 text-xs',
											!active && 'text-muted-foreground'
										)}
									>
										{count}
									</span>
								)}
							</Button>
						);
					})}
				</div>
			</div>

			{isLoading && <TableSkeleton rows={8} />}
			{error && <AlertMessage message={error.message} variant='destructive' />}

			{data && data.data.length === 0 && !isLoading && (
				<EmptyMessage
					message='No Folk companies yet'
					description='Add a Folk group in Configuration, then run Seed from Folk to pull its companies in.'
				/>
			)}

			{data && data.data.length > 0 && (
				<CustomTable
					data={data.data}
					columns={columns}
					enablePagination
					paginationMode='server'
					pageSize={filters.limit}
					currentPage={filters.page}
					totalCount={data.totalCount}
					onPaginationChange={(page, limit) =>
						setFilters({ ...filters, page, limit })
					}
				/>
			)}

			<CustomAlertDialog
				isOpen={action?.type === 'unmap'}
				onClose={closeAction}
				title='Mark as unmapped?'
				description={`${companyName} will stay in Folk. Linked Sauero customers will be unlinked and it will not receive order metrics.`}
				cancelText='Cancel'
				confirmText='Mark unmapped'
				isLoading={isUnmapping}
				onConfirm={() => {
					if (action?.type !== 'unmap') return;
					unmap(action.mapping.id, { onSuccess: closeAction });
				}}
			/>

			<CustomAlertDialog
				isOpen={action?.type === 'confirm'}
				onClose={closeAction}
				title='Confirm this mapping?'
				description={`${companyName} will be mapped to ${proposedName} and start receiving its order metrics in Folk.`}
				icon={<Check className='size-8 text-primary' />}
				iconBackgroundClassName='bg-primary/10'
				confirmButtonClassName=''
				cancelText='Cancel'
				confirmText='Confirm mapping'
				isLoading={isLinking}
				onConfirm={() => {
					const proposedId = action?.mapping.proposedCustomer?.id;
					if (action?.type !== 'confirm' || !proposedId) return;
					linkCustomer(
						{ id: action.mapping.id, data: { customerId: proposedId } },
						{ onSuccess: closeAction }
					);
				}}
			/>

			<CustomAlertDialog
				isOpen={action?.type === 'deny'}
				onClose={closeAction}
				title='Deny this proposal?'
				description={`The proposal to map ${companyName} to ${proposedName} will be removed and the company will be unmapped. It won't be proposed again; you can still pick a customer manually.`}
				cancelText='Cancel'
				confirmText='Deny proposal'
				isLoading={isDenying}
				onConfirm={() => {
					if (action?.type !== 'deny') return;
					deny(action.mapping.id, { onSuccess: closeAction });
				}}
			/>

			{action?.type === 'pick' && (
				<FolkCustomerPickerDialog
					key={action.mapping.id}
					mapping={action.mapping}
					onClose={closeAction}
				/>
			)}
		</div>
	);
};

export default FolkMappingComponent;
