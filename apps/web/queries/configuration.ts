import type { UpdateConfigurationInput } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfigurationService } from '@/services';

const configQueryKeys = {
	all: ['configuration'] as const,
};

export function useConfiguration() {
	return useQuery({
		queryKey: configQueryKeys.all,
		queryFn: () => ConfigurationService.getConfiguration(),
	});
}

export function useUpdateConfiguration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateConfigurationInput) =>
			ConfigurationService.updateConfiguration(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: configQueryKeys.all });
			toast.success('Configuration saved');
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}
