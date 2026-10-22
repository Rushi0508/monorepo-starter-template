import type {
	CreateSkuChannelFulfillmentCostInput,
	CreateSkuChannelPriceInput,
	CreateSkuCogsInput,
	CreateSkuColumnInput,
	CreateSkuMsrpInput,
	CreateSkuSettingInput,
	ReorderSkuColumnsInput,
	SkuOptionsFilterType,
	UpdateSkuSettingsInput,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SkuService } from '@/services';

const skuQueryKeys = {
	options: ['skus', 'options'] as const,
	settings: ['skus', 'settings'] as const,
	check: (sku: string, excludeId?: string) =>
		['skus', 'check', sku, excludeId ?? null] as const,
	auditLogs: ['skus', 'audit-logs'] as const,
	pricing: (skuSettingId: string) => ['skus', 'pricing', skuSettingId] as const,
};

export function useSkuAuditLogs(enabled = true) {
	return useQuery({
		queryKey: skuQueryKeys.auditLogs,
		queryFn: () => SkuService.getAuditLogs(),
		enabled,
		refetchOnMount: 'always',
		staleTime: 0,
		gcTime: 0,
	});
}

export function useSkuOptions(filter?: SkuOptionsFilterType) {
	return useQuery({
		queryKey: [...skuQueryKeys.options, filter ?? {}],
		queryFn: () => SkuService.getSkuOptions(filter),
		staleTime: 5 * 60 * 1000,
	});
}

export function useSkuSettings() {
	return useQuery({
		queryKey: skuQueryKeys.settings,
		queryFn: () => SkuService.getSkuSettings(),
		refetchOnMount: 'always',
	});
}

export function useCheckSku(sku: string, excludeId?: string) {
	return useQuery({
		queryKey: skuQueryKeys.check(sku, excludeId),
		queryFn: () => SkuService.checkSku(sku, excludeId),
		enabled: sku.trim().length >= 2,
	});
}

export function useCreateSkuSetting() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuSettingInput) =>
			SkuService.createSkuSetting(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('SKU added successfully');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUpdateSkuSettings() {
	return useMutation({
		mutationFn: (input: UpdateSkuSettingsInput) =>
			SkuService.updateSkuSettings(input),
		// Silent — used for autosave; errors still surface
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useCreateSkuColumn() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuColumnInput) => SkuService.createColumn(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('Column added');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUpdateSkuColumn() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string;
			input: Partial<CreateSkuColumnInput>;
		}) => SkuService.updateColumn(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('Column updated');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useReorderSkuColumns() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: ReorderSkuColumnsInput) =>
			SkuService.reorderColumns(input),
		// Don't invalidate — grid already shows new order; refetch would fight HOT move map
		onError: (error) => {
			toast.error(error.message);
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
		},
	});
}

export function useDeleteSkuColumn() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteColumn(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('Column deleted');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUpdateSkuSetting() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string;
			input: Partial<CreateSkuSettingInput>;
		}) => SkuService.updateSkuSetting(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('SKU updated');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useDeleteSkuSetting() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteSkuSetting(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: skuQueryKeys.settings });
			toast.success('SKU deleted');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

// ── Pricing ──────────────────────────────────────────────────────────────────

export function useSkuPricing(skuSettingId: string | null) {
	return useQuery({
		queryKey: skuQueryKeys.pricing(skuSettingId ?? ''),
		queryFn: () => SkuService.getSkuPricing(skuSettingId as string),
		enabled: Boolean(skuSettingId),
	});
}

export function useAddCogs(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuCogsInput) =>
			SkuService.addCogs(skuSettingId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('COGS added');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useAddChannelFulfillmentCost(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuChannelFulfillmentCostInput) =>
			SkuService.addChannelFulfillmentCost(skuSettingId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Fulfillment cost added');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useAddChannelPrice(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuChannelPriceInput) =>
			SkuService.addChannelPrice(skuSettingId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Price added');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useAddMsrp(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateSkuMsrpInput) =>
			SkuService.addMsrp(skuSettingId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('MSRP added');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useDeleteCogs(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteCogs(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Version removed');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useDeleteChannelFulfillmentCost(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteChannelFulfillmentCost(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Version removed');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useDeleteChannelPrice(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteChannelPrice(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Version removed');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useDeleteMsrp(skuSettingId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => SkuService.deleteMsrp(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: skuQueryKeys.pricing(skuSettingId),
			});
			toast.success('Version removed');
		},
		onError: (error) => toast.error(error.message),
	});
}
