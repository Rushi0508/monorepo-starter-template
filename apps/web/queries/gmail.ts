import { InboundEmailStatusEnum, type InboundEmailTypeEnum } from '@repo/enums';
import type { InboundEmailListResponseType } from '@repo/types';
import {
	type QueryClient,
	type QueryKey,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { GmailService } from '@/services';

export const gmailQueryKeys = {
	all: ['gmail'] as const,
	status: () => [...gmailQueryKeys.all, 'status'] as const,
	/** Without a type: the prefix covering every tab's list */
	inboundEmails: (type?: InboundEmailTypeEnum) =>
		type
			? ([...gmailQueryKeys.all, 'inbound-emails', type] as const)
			: ([...gmailQueryKeys.all, 'inbound-emails'] as const),
};

type InboundEmailListSnapshot = [
	QueryKey,
	InboundEmailListResponseType | undefined,
][];

/**
 * Optimistically sets an email's status in whichever tab's list holds it,
 * returning the lists as they were so an error can roll them back.
 */
async function setInboundEmailStatus(
	queryClient: QueryClient,
	id: string,
	status: InboundEmailStatusEnum
): Promise<InboundEmailListSnapshot> {
	const queryKey = gmailQueryKeys.inboundEmails();
	await queryClient.cancelQueries({ queryKey });
	const previous = queryClient.getQueriesData<InboundEmailListResponseType>({
		queryKey,
	});
	queryClient.setQueriesData<InboundEmailListResponseType>(
		{ queryKey },
		(current) =>
			current && {
				...current,
				data: current.data.map((email) =>
					email.id === id ? { ...email, status } : email
				),
			}
	);
	return previous;
}

function restoreInboundEmailLists(
	queryClient: QueryClient,
	previous: InboundEmailListSnapshot | undefined
) {
	for (const [queryKey, data] of previous ?? []) {
		queryClient.setQueryData(queryKey, data);
	}
}

export function useGmailStatus() {
	return useQuery({
		queryKey: gmailQueryKeys.status(),
		queryFn: () => GmailService.getStatus(),
	});
}

export function useInboundEmails(type: InboundEmailTypeEnum) {
	return useQuery({
		queryKey: gmailQueryKeys.inboundEmails(type),
		queryFn: () => GmailService.listInboundEmails(type),
		refetchInterval: 10_000,
	});
}

export function useDisconnectGmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => GmailService.disconnect(),
		onSuccess: () => {
			toast.success('Gmail disconnected');
			queryClient.invalidateQueries({ queryKey: gmailQueryKeys.all });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to disconnect Gmail');
		},
	});
}

export function useProcessInboundEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => GmailService.processInboundEmail(id),
		onMutate: async (id) => ({
			previous: await setInboundEmailStatus(
				queryClient,
				id,
				InboundEmailStatusEnum.PROCESSING
			),
		}),
		onSuccess: (result) => {
			if (result.processed) {
				toast.success('Email processed');
			} else {
				toast.error('Email processing failed');
			}
		},
		onError: (error: Error, _id, context) => {
			restoreInboundEmailLists(queryClient, context?.previous);
			toast.error(error.message || 'Failed to process email');
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: gmailQueryKeys.inboundEmails(),
			});
		},
	});
}

export function useMarkInboundEmailProcessed() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => GmailService.markInboundEmailProcessed(id),
		onMutate: async (id) => ({
			previous: await setInboundEmailStatus(
				queryClient,
				id,
				InboundEmailStatusEnum.PROCESSED
			),
		}),
		onSuccess: () => {
			toast.success('Marked as processed');
		},
		onError: (error: Error, _id, context) => {
			restoreInboundEmailLists(queryClient, context?.previous);
			toast.error(error.message || 'Failed to mark as processed');
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: gmailQueryKeys.inboundEmails(),
			});
		},
	});
}

export function useDeleteInboundEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => GmailService.deleteInboundEmail(id),
		onSuccess: () => {
			toast.success('Email deleted');
			queryClient.invalidateQueries({
				queryKey: gmailQueryKeys.inboundEmails(),
			});
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to delete email');
		},
	});
}
