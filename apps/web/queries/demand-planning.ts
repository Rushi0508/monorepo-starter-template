import type {
	CreateDemandPlanInput,
	CreateDemandScenarioInput,
	CreateSkuChannelFulfillmentCostInput,
	CreateSkuChannelPriceInput,
	CreateSkuCogsInput,
	DemandAccuracyFilterType,
	DemandGridType,
	FinalizeDemandPlanInput,
	SetDemandEntryInput,
	SetForecastMethodInput,
	UpdateDemandPlanInput,
} from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DemandPlanningService } from '@/services';

const keys = {
	all: ['demand-plans'] as const,
	list: ['demand-plans', 'list'] as const,
	operative: ['demand-plans', 'operative'] as const,
	audits: (id: string) => ['demand-plans', 'audits', id] as const,
	detail: (id: string) => ['demand-plans', 'detail', id] as const,
	forecastMethods: (id: string) =>
		['demand-plans', 'forecast-methods', id] as const,
	pricing: (id: string) => ['demand-plans', 'pricing', id] as const,
	grid: (id: string) => ['demand-plans', 'grid', id] as const,
	scenarios: (basePlanId?: string) =>
		['demand-plans', 'scenarios', basePlanId ?? 'all'] as const,
	accuracy: (filters: DemandAccuracyFilterType) =>
		['demand-plans', 'accuracy', filters] as const,
	comparison: (planAId: string, planBId: string) =>
		['demand-plans', 'comparison', planAId, planBId] as const,
};

export function useOperativePlan() {
	return useQuery({
		queryKey: keys.operative,
		queryFn: () => DemandPlanningService.getOperativePlan(),
	});
}

export function useDemandPlan(planId: string | null) {
	return useQuery({
		queryKey: keys.detail(planId ?? ''),
		queryFn: () => DemandPlanningService.getPlan(planId as string),
		enabled: Boolean(planId),
	});
}

export function usePlanAudits(planId: string | null) {
	return useQuery({
		queryKey: keys.audits(planId ?? ''),
		queryFn: () => DemandPlanningService.getAudits(planId as string),
		enabled: Boolean(planId),
	});
}

export function useDemandPlans() {
	return useQuery({
		queryKey: keys.list,
		queryFn: () => DemandPlanningService.listPlans(),
	});
}

export function useCreateDemandPlan() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateDemandPlanInput) =>
			DemandPlanningService.createPlan(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Plan created');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useDeleteDemandPlan() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => DemandPlanningService.deletePlan(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Plan deleted');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function useUpdateDemandPlan(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateDemandPlanInput) =>
			DemandPlanningService.updatePlan(planId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Plan updated');
		},
		onError: (error) => toast.error(error.message),
	});
}

/**
 * Finalizing freezes the plan's baseline server-side, so every cached view of
 * it — grid, history, the operative plan — is now describing a different thing.
 */
export function useFinalizeDemandPlan(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: FinalizeDemandPlanInput) =>
			DemandPlanningService.finalizePlan(planId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Plan finalized');
		},
		onError: (error) => toast.error(error.message),
	});
}

/** Unlocking and rolling forward both change which plan is operative. */
export function usePlanLifecycle() {
	const queryClient = useQueryClient();

	const settled = (message: string) => ({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success(message);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return {
		unlock: useMutation({
			mutationFn: (id: string) => DemandPlanningService.unlockPlan(id),
			...settled('Plan unlocked'),
		}),
		rollForward: useMutation({
			mutationFn: (id: string) => DemandPlanningService.rollForwardPlan(id),
			...settled('Next cycle started'),
		}),
	};
}

export function useImportPlan(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => DemandPlanningService.importPlan(planId, file),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success(
				`Imported ${result.cells} cells across ${result.series} series`
			);
		},
	});
}

export function useForecastMethods(planId: string | null) {
	return useQuery({
		queryKey: keys.forecastMethods(planId ?? ''),
		queryFn: () => DemandPlanningService.getForecastMethods(planId as string),
		enabled: Boolean(planId),
	});
}

export function useSetForecastMethod(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SetForecastMethodInput) =>
			DemandPlanningService.setForecastMethod(planId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Forecast method updated');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function usePlanPricing(planId: string | null) {
	return useQuery({
		queryKey: keys.pricing(planId ?? ''),
		queryFn: () => DemandPlanningService.getPricing(planId as string),
		enabled: Boolean(planId),
	});
}

/** Adding any version invalidates the whole plan, since the grid re-prices. */
export function useAddPlanPricing(planId: string) {
	const queryClient = useQueryClient();

	const onSettled = {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Saved');
		},
		onError: (error: Error) => toast.error(error.message),
	};

	const cogs = useMutation({
		mutationFn: (input: CreateSkuCogsInput & { skuSettingId: string }) =>
			DemandPlanningService.addPlanCogs(planId, input.skuSettingId, input),
		...onSettled,
	});

	const fulfillment = useMutation({
		mutationFn: (
			input: CreateSkuChannelFulfillmentCostInput & { skuSettingId: string }
		) =>
			DemandPlanningService.addPlanFulfillmentCost(
				planId,
				input.skuSettingId,
				input
			),
		...onSettled,
	});

	const price = useMutation({
		mutationFn: (
			input: CreateSkuChannelPriceInput & { skuSettingId: string }
		) =>
			DemandPlanningService.addPlanChannelPrice(
				planId,
				input.skuSettingId,
				input
			),
		...onSettled,
	});

	return { cogs, fulfillment, price };
}

export function useRemovePlanPricing(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (args: {
			kind: 'cogs' | 'channel-fulfillment-cost' | 'channel-price';
			versionId: string;
		}) =>
			DemandPlanningService.removePlanPricing(
				planId,
				args.kind,
				args.versionId
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Removed');
		},
		onError: (error) => toast.error(error.message),
	});
}

export function usePlanComparison(
	planAId: string | null,
	planBId: string | null
) {
	return useQuery({
		queryKey: keys.comparison(planAId ?? '', planBId ?? ''),
		queryFn: () =>
			DemandPlanningService.comparePlans(planAId as string, planBId as string),
		enabled: Boolean(planAId && planBId && planAId !== planBId),
	});
}

export function useDemandAccuracy(filters: DemandAccuracyFilterType) {
	return useQuery({
		queryKey: keys.accuracy(filters),
		queryFn: () => DemandPlanningService.getAccuracy(filters),
	});
}

export function useScenarios(basePlanId?: string) {
	return useQuery({
		queryKey: keys.scenarios(basePlanId),
		queryFn: () => DemandPlanningService.listScenarios(basePlanId),
	});
}

export function useCreateScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateDemandScenarioInput) =>
			DemandPlanningService.createScenario(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success('Scenario created');
		},
		onError: (error) => toast.error(error.message),
	});
}

/** Save, reopen, duplicate and delete all move a scenario between states. */
export function useScenarioActions() {
	const queryClient = useQueryClient();

	const settled = (message: string) => ({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: keys.all });
			toast.success(message);
		},
		onError: (error: Error) => toast.error(error.message),
	});

	return {
		save: useMutation({
			mutationFn: (id: string) => DemandPlanningService.saveScenario(id),
			...settled('Scenario saved'),
		}),
		reopen: useMutation({
			mutationFn: (id: string) => DemandPlanningService.reopenScenario(id),
			...settled('Scenario reopened'),
		}),
		duplicate: useMutation({
			mutationFn: (id: string) => DemandPlanningService.duplicateScenario(id),
			...settled('Scenario duplicated'),
		}),
		promote: useMutation({
			mutationFn: (id: string) => DemandPlanningService.promoteScenario(id),
			...settled('Scenario promoted to a base plan'),
		}),
		remove: useMutation({
			mutationFn: (id: string) => DemandPlanningService.deleteScenario(id),
			...settled('Scenario deleted'),
		}),
	};
}

export function usePlanGrid(planId: string | null) {
	return useQuery({
		queryKey: keys.grid(planId ?? ''),
		queryFn: () => DemandPlanningService.getGrid(planId as string),
		enabled: Boolean(planId),
	});
}

/**
 * Types into one cell.
 *
 * The endpoint returns the cell it recomputed, so that one cell is swapped into
 * the cached grid rather than refetching it. An override never moves the
 * statistical baseline, so nothing else in the grid can have changed.
 */
export function useSetDemandEntry(planId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: SetDemandEntryInput) =>
			DemandPlanningService.setEntry(planId, input),
		onSuccess: (cell, input) => {
			queryClient.setQueryData<DemandGridType>(keys.grid(planId), (current) =>
				current
					? {
							...current,
							series: current.series.map((series) =>
								series.channel === input.channel &&
								series.skuSettingId === input.skuSettingId
									? {
											...series,
											cells: { ...series.cells, [input.period]: cell },
										}
									: series
							),
						}
					: current
			);
			// Plan History shows per-plan totals, which this moved.
			queryClient.invalidateQueries({ queryKey: keys.list });
		},
		onError: (error) => toast.error(error.message),
	});
}
