import type {
	CreateProductionRunInput,
	CreateReplenishmentOrderInput,
	InventorySummaryFilterType,
	UpdateProductionRunInput,
} from '@repo/types';
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { InventoryService } from '@/services';

const inventoryQueryKeys = {
	all: ['inventory'] as const,
	summary: (filters: InventorySummaryFilterType) =>
		[...inventoryQueryKeys.all, 'summary', filters] as const,
	skus: () => [...inventoryQueryKeys.all, 'skus'] as const,
	asns: () => [...inventoryQueryKeys.all, 'asns'] as const,
	productionRuns: () => [...inventoryQueryKeys.all, 'production-runs'] as const,
	kitOrders: () => [...inventoryQueryKeys.all, 'kit-orders'] as const,
	mb: () => [...inventoryQueryKeys.all, 'mb'] as const,
	replenishmentOrders: () =>
		[...inventoryQueryKeys.all, 'replenishment-orders'] as const,
};

export function useInventorySummary(filters: InventorySummaryFilterType) {
	return useQuery({
		queryKey: inventoryQueryKeys.summary(filters),
		queryFn: () => InventoryService.getInventorySummary(filters),
		// Switching the breakdown refetches; keep the table on screen instead
		placeholderData: keepPreviousData,
	});
}

// ── Bluebox ─────────────────────────────────────────────────────────────────────
export function useBlueboxInventory() {
	return useQuery({
		queryKey: inventoryQueryKeys.skus(),
		queryFn: () => InventoryService.getBlueboxInventory(),
	});
}

export function useBlueboxAsns() {
	return useQuery({
		queryKey: inventoryQueryKeys.asns(),
		queryFn: () => InventoryService.getBlueboxAsns(),
	});
}

export function useBlueboxProductionRuns() {
	return useQuery({
		queryKey: inventoryQueryKeys.productionRuns(),
		queryFn: () => InventoryService.getBlueboxProductionRuns(),
	});
}

export function useCreateBlueboxProductionRun() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateProductionRunInput) =>
			InventoryService.createBlueboxProductionRun(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: inventoryQueryKeys.productionRuns(),
			});
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.skus() });
			toast.success('Production run created successfully');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

function useInvalidateProductionRuns() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({
			queryKey: inventoryQueryKeys.productionRuns(),
		});
		queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.skus() });
	};
}

export function useUpdateBlueboxProductionRun() {
	const invalidate = useInvalidateProductionRuns();
	return useMutation({
		mutationFn: ({ id, ...input }: UpdateProductionRunInput & { id: string }) =>
			InventoryService.updateBlueboxProductionRun(id, input),
		onSuccess: (res) => {
			invalidate();
			toast.success(res.message);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useDeleteBlueboxProductionRun() {
	const invalidate = useInvalidateProductionRuns();
	return useMutation({
		mutationFn: (id: string) => InventoryService.deleteBlueboxProductionRun(id),
		onSuccess: (res) => {
			invalidate();
			toast.success(res.message);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useBlueboxKitOrders() {
	return useQuery({
		queryKey: inventoryQueryKeys.kitOrders(),
		queryFn: () => InventoryService.getBlueboxKitOrders(),
	});
}

// ── Manuel Brothers ─────────────────────────────────────────────────────────
export function useManuelBrothersInventory() {
	return useQuery({
		queryKey: inventoryQueryKeys.mb(),
		queryFn: () => InventoryService.getManuelBrothersInventory(),
	});
}

export function useReplenishmentOrders() {
	return useQuery({
		queryKey: inventoryQueryKeys.replenishmentOrders(),
		queryFn: () => InventoryService.getReplenishmentOrders(),
	});
}

export function useCreateReplenishmentOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateReplenishmentOrderInput) =>
			InventoryService.createReplenishmentOrder(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: inventoryQueryKeys.replenishmentOrders(),
			});
			toast.success('Replenishment order created');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
