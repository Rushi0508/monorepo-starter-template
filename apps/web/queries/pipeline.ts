import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataPipelineService } from '@/services';

const pipelineQueryKeys = {
	all: ['data-pipelines'] as const,
};

export function useDataPipelines() {
	return useQuery({
		queryKey: pipelineQueryKeys.all,
		queryFn: () => DataPipelineService.getAll(),
		refetchInterval: 5_000,
	});
}

export function useTriggerPipeline() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ name, force }: { name: string; force?: boolean }) =>
			DataPipelineService.trigger(name, force ?? false),
		onSuccess: (data) => {
			toast.success(data.message);
			queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.all });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useSetPipelinePaused() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ name, isPaused }: { name: string; isPaused: boolean }) =>
			DataPipelineService.setPaused(name, isPaused),
		onSuccess: (data) => {
			toast.success(data.message);
			queryClient.invalidateQueries({ queryKey: pipelineQueryKeys.all });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
