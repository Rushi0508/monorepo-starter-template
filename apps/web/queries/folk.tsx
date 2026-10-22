import type {
	FolkCustomerSearchInput,
	FolkFieldPreflightResultType,
	FolkLinkCustomerInput,
	FolkMappingFilterType,
} from '@repo/types';
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { FolkService } from '@/services';

export const FOLK_CUSTOMER_SEARCH_MIN_CHARS = 3;

const countBy = (
	result: FolkFieldPreflightResultType,
	pick: (group: FolkFieldPreflightResultType['groups'][number]) => number
) => result.groups.reduce((sum, group) => sum + pick(group), 0);

const folkQueryKeys = {
	all: ['folk'] as const,
	list: (filters: FolkMappingFilterType) =>
		[...folkQueryKeys.all, 'list', filters] as const,
	summary: () => [...folkQueryKeys.all, 'summary'] as const,
	customers: (data: FolkCustomerSearchInput) =>
		[...folkQueryKeys.all, 'customers', data] as const,
	groups: () => [...folkQueryKeys.all, 'groups'] as const,
};

export function useFolkGroups() {
	return useQuery({
		queryKey: folkQueryKeys.groups(),
		queryFn: () => FolkService.listGroups(),
		refetchOnMount: 'always',
	});
}

export function useSetFolkTrackedGroups() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (folkGroupIds: string[]) =>
			FolkService.setTrackedGroups({ folkGroupIds }),
		onSuccess: ({ removedMappings }) => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success('Folk groups updated', {
				description:
					removedMappings > 0
						? `Removed ${removedMappings} mapping(s). Run Seed from Folk to refresh the rest.`
						: 'Run Seed from Folk to pull in their companies.',
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useFolkMappings(filters: FolkMappingFilterType) {
	return useQuery({
		queryKey: folkQueryKeys.list(filters),
		queryFn: () => FolkService.listMappings(filters),
		refetchOnMount: 'always',
	});
}

export function useFolkMappingSummary() {
	return useQuery({
		queryKey: folkQueryKeys.summary(),
		queryFn: () => FolkService.summary(),
		refetchOnMount: 'always',
	});
}

export function useFolkCustomerSearch(data: FolkCustomerSearchInput) {
	return useQuery({
		queryKey: folkQueryKeys.customers(data),
		queryFn: () => FolkService.searchCustomers(data),
		enabled:
			!!data.search &&
			data.search.trim().length >= FOLK_CUSTOMER_SEARCH_MIN_CHARS,
		placeholderData: keepPreviousData,
	});
}

export function useLinkFolkCustomer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FolkLinkCustomerInput }) =>
			FolkService.linkCustomer(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success('Customer linked');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUnlinkFolkCustomer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, customerId }: { id: string; customerId: string }) =>
			FolkService.unlinkCustomer(id, customerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success('Customer unlinked');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useDenyFolkProposal() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => FolkService.denyProposal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success('Proposal denied');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUnmapFolkCompany() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => FolkService.markUnmapped(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success('Marked unmapped');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useSeedFolkMappings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => FolkService.seed(),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: folkQueryKeys.all });
			toast.success(
				`Seeded ${result.upserted} companies (${result.proposed} proposed, ${result.deleted} deleted)`
			);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

const PreflightSummary = ({
	result,
}: {
	result: FolkFieldPreflightResultType;
}) => (
	<div className='mt-1 space-y-2'>
		{result.groups.map((group) => {
			const isClean =
				group.created.length === 0 &&
				group.mismatches.length === 0 &&
				group.missingReadOnly.length === 0;

			return (
				<div key={group.groupId} className='space-y-1'>
					<p className='font-medium'>{group.label}</p>
					<ul className='list-disc space-y-0.5 pl-4'>
						{isClean && <li>All fields present and correctly typed.</li>}

						{group.created.map((name) => (
							<li key={`created-${name}`}>
								Created <span className='font-medium'>{name}</span>
							</li>
						))}

						{group.mismatches.map((mismatch) => (
							<li key={`mismatch-${mismatch.name}`}>
								<span className='font-medium'>{mismatch.name}</span> — expected{' '}
								<span className='font-mono'>{mismatch.expected}</span>, found{' '}
								<span className='font-mono'>{mismatch.actual}</span>
							</li>
						))}

						{group.missingReadOnly.map((name) => (
							<li key={`missing-${name}`}>
								<span className='font-medium'>{name}</span> — missing in Folk,
								add it there
							</li>
						))}
					</ul>
				</div>
			);
		})}
	</div>
);

export function useFolkPreflight() {
	return useMutation({
		mutationFn: () => FolkService.preflight(),
		onSuccess: (result) => {
			const created = countBy(result, (group) => group.created.length);
			const mismatches = countBy(result, (group) => group.mismatches.length);
			const missing = countBy(result, (group) => group.missingReadOnly.length);
			const needsAttention = mismatches + missing > 0;

			const title = needsAttention
				? `Preflight found ${mismatches + missing} issue(s)`
				: `Preflight passed${created > 0 ? ` — created ${created} field(s)` : ''}`;

			// Mismatches need reading and acting on, so they stay up much longer.
			const notify = needsAttention ? toast.warning : toast.success;
			notify(title, {
				description: <PreflightSummary result={result} />,
				duration: needsAttention ? 30_000 : 6_000,
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
