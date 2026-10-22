import type {
	CreateCustomerInput,
	CreateSampleOrdersInput,
	CreateSampleOrdersResponseType,
	CustomerFilterType,
	SampleOrderFailedCustomerType,
	UpdateCustomerInput,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CustomersService } from '@/services';

const customersQueryKeys = {
	all: ['customers'] as const,
	list: (filters: CustomerFilterType) => [...customersQueryKeys.all, filters],
	detail: (id: string) => [...customersQueryKeys.all, id],
};

export function useCustomers(filters: CustomerFilterType) {
	return useQuery({
		queryKey: customersQueryKeys.list(filters),
		queryFn: () => CustomersService.getCustomers(filters),
	});
}

export function useCustomerDetail(id: string) {
	return useQuery({
		queryKey: customersQueryKeys.detail(id),
		queryFn: () => CustomersService.getCustomerDetail(id),
		enabled: !!id,
	});
}

export function useUpdateCustomer(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateCustomerInput) =>
			CustomersService.updateCustomer(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: customersQueryKeys.detail(id),
			});
			toast.success('Store count saved');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useCreateCustomer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateCustomerInput) =>
			CustomersService.createCustomer(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: customersQueryKeys.all });
			toast.success('Customer created in Shopify');
		},
	});
}

const SampleOrderSummary = ({
	failedCustomers,
	failedNote,
	warnings,
}: {
	failedCustomers: SampleOrderFailedCustomerType[];
	failedNote?: string;
	warnings: string[];
}) => (
	<div className='mt-1 space-y-2'>
		{failedCustomers.length > 0 && (
			<>
				<p>Failed for:</p>
				<ul className='list-disc space-y-0.5 pl-4'>
					{failedCustomers.map((c) => (
						<li key={c.id}>{c.name}</li>
					))}
				</ul>
				{failedNote && <p>{failedNote}</p>}
			</>
		)}
		{warnings.length > 0 && (
			<ul className='list-disc space-y-0.5 pl-4'>
				{warnings.map((warning) => (
					<li key={warning}>{warning}</li>
				))}
			</ul>
		)}
	</div>
);

const notifySampleOrderResults = (
	{
		createdCount,
		failedCount,
		failedCustomers,
		warnings,
	}: CreateSampleOrdersResponseType,
	failedNote?: string
) => {
	const plural = (n: number) => (n === 1 ? 'sample order' : 'sample orders');

	if (!failedCount && !warnings.length) {
		toast.success(
			`${createdCount} ${plural(createdCount)} created in Shopify`,
			{
				duration: 10_000,
			}
		);
		return;
	}

	const title = !failedCount
		? `${createdCount} ${plural(createdCount)} created in Shopify`
		: createdCount
			? `${createdCount} ${plural(createdCount)} created, ${failedCount} failed`
			: `${failedCount} ${plural(failedCount)} failed`;

	const notify = createdCount ? toast.warning : toast.error;
	notify(title, {
		description: (
			<SampleOrderSummary
				failedCustomers={failedCustomers}
				failedNote={failedNote}
				warnings={warnings}
			/>
		),
		duration: 30_000,
	});
};

export function useCreateSampleOrders(options?: { failedNote?: string }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSampleOrdersInput) =>
			CustomersService.createSampleOrders(input),
		onSuccess: (response) => {
			queryClient.invalidateQueries({ queryKey: customersQueryKeys.all });
			notifySampleOrderResults(response, options?.failedNote);
		},
	});
}
