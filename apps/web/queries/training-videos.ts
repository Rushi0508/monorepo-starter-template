import type { CreateTrainingVideoInput } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TrainingVideosService } from '@/services';

const trainingVideosQueryKeys = {
	all: ['training-videos'] as const,
};

export function useTrainingVideos({ enabled = true } = {}) {
	return useQuery({
		queryKey: trainingVideosQueryKeys.all,
		queryFn: () => TrainingVideosService.list(),
		enabled,
	});
}

export function useCreateTrainingVideo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateTrainingVideoInput) =>
			TrainingVideosService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trainingVideosQueryKeys.all });
			toast.success('Training video added');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useUpdateTrainingVideo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<CreateTrainingVideoInput>;
		}) => TrainingVideosService.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trainingVideosQueryKeys.all });
			toast.success('Training video updated');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function useDeleteTrainingVideo() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => TrainingVideosService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trainingVideosQueryKeys.all });
			toast.success('Training video deleted');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
