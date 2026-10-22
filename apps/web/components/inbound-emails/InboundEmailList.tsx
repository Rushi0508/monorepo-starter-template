'use client';

import { InboundEmailStatusEnum, InboundEmailTypeEnum } from '@repo/enums';
import type { InboundEmailType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { cn } from '@repo/ui/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import {
	CheckCircle2,
	ChevronRight,
	ExternalLink,
	Inbox,
	Loader2,
	MoreHorizontal,
	Paperclip,
	Play,
	Trash2,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import EmptyMessage from '@/components/general/EmptyMessage';
import { SkletonLoader } from '@/components/general/SkletonLoader';
import {
	useDeleteInboundEmail,
	useGmailStatus,
	useInboundEmails,
	useMarkInboundEmailProcessed,
	useProcessInboundEmail,
} from '@/queries';
import { gmailThreadUrl } from '@/utils/get-urls';
import { InboundEmailDetailSheet } from './InboundEmailDetailSheet';
import { InboundEmailStatusBadge } from './InboundEmailStatusBadge';

const EMAIL_ID_PARAM = 'emailId';

const TYPE_COPY: Record<
	InboundEmailTypeEnum,
	{ title: string; empty: string; deleteTitle: string }
> = {
	[InboundEmailTypeEnum.POD]: {
		title: 'POD emails',
		empty: 'No POD emails yet',
		deleteTitle: 'Delete POD email?',
	},
	[InboundEmailTypeEnum.PICKUP]: {
		title: 'Pickup emails',
		empty: 'No pickup emails yet',
		deleteTitle: 'Delete pickup email?',
	},
};

function formatReceivedAt(value: Date | string | null): string {
	if (!value) return '—';
	const date = value instanceof Date ? value : new Date(value);
	if (isToday(date)) return format(date, 'h:mm a');
	if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`;
	return format(date, 'MMM d, yyyy');
}

function extractSender(from: string | null): string {
	if (!from) return 'Unknown sender';
	const match = from.match(/^"?([^"<]+)"?\s*</);
	if (match?.[1]) return match[1].trim();
	return from;
}

interface InboundEmailListProps {
	type: InboundEmailTypeEnum;
}

const InboundEmailList = ({ type }: InboundEmailListProps) => {
	const copy = TYPE_COPY[type];
	const { data, isLoading, error } = useInboundEmails(type);
	const { data: gmailStatus } = useGmailStatus();
	const gmailAccount = gmailStatus?.email ?? null;
	const {
		mutate: processEmail,
		isPending: isProcessing,
		variables: processId,
	} = useProcessInboundEmail();
	const {
		mutate: markEmailProcessed,
		isPending: isMarking,
		variables: markId,
	} = useMarkInboundEmailProcessed();
	const {
		mutate: deleteEmail,
		isPending: isDeleting,
		variables: deleteId,
	} = useDeleteInboundEmail();

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const emailIdParam = searchParams.get(EMAIL_ID_PARAM);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<InboundEmailType | null>(
		null
	);

	const emails = data?.data ?? [];
	const selected = emails.find((email) => email.id === selectedId) ?? null;

	/** Mirrors the open email into the URL so the sheet survives a reload. */
	const syncUrl = useCallback(
		(id: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (id) params.set(EMAIL_ID_PARAM, id);
			else params.delete(EMAIL_ID_PARAM);

			const query = params.toString();
			router.replace(query ? `${pathname}?${query}` : pathname, {
				scroll: false,
			});
		},
		[searchParams, pathname, router]
	);

	// Deep link: ?emailId=<id> opens that email's sheet, so the order detail
	// sheet and the replenishment table can link straight to the email that
	// closed their flow.
	//
	// Keyed on the param value alone, via a ref of the last one applied. Reacting
	// to selectedId as well would re-open the sheet the moment it closes, because
	// the state clears a render before router.replace drops the param.
	const appliedParam = useRef<string | null>(null);

	useEffect(() => {
		if (emailIdParam === appliedParam.current) return;
		appliedParam.current = emailIdParam;
		if (!emailIdParam) return;

		setSelectedId(emailIdParam);
		setSheetOpen(true);
	}, [emailIdParam]);

	// Drop a selection that no longer exists — deleted, or a stale deep link.
	// Gated on the list having loaded, otherwise it closes a valid deep link
	// while the emails are still in flight (and fights the effect above).
	useEffect(() => {
		if (!data || !sheetOpen || !selectedId || selected) return;
		setSheetOpen(false);
		setSelectedId(null);
		syncUrl(null);
	}, [data, sheetOpen, selectedId, selected, syncUrl]);

	const openEmail = (email: InboundEmailType) => {
		appliedParam.current = email.id;
		setSelectedId(email.id);
		setSheetOpen(true);
		syncUrl(email.id);
	};

	const handleSheetOpenChange = (open: boolean) => {
		setSheetOpen(open);
		if (!open) {
			appliedParam.current = null;
			setSelectedId(null);
			syncUrl(null);
		}
	};

	const confirmDelete = () => {
		if (!deleteTarget) return;
		deleteEmail(deleteTarget.id, {
			onSettled: () => setDeleteTarget(null),
		});
	};

	if (isLoading) {
		return (
			<div className='rounded-lg border bg-card p-3'>
				<SkletonLoader count={5} className='h-10' />
			</div>
		);
	}

	if (error) {
		return <AlertMessage message={error.message} />;
	}

	return (
		<>
			<div className='overflow-hidden rounded-lg border bg-card'>
				<div className='flex items-center justify-between border-b px-4 py-2.5'>
					<h2 className='text-sm font-semibold'>
						{copy.title}
						{data && (
							<span className='ml-1.5 font-normal text-muted-foreground'>
								• {data.totalCount}
							</span>
						)}
					</h2>
				</div>

				{emails.length === 0 ? (
					<EmptyMessage
						message={copy.empty}
						description='Matching inbox messages will show up here after the next sync.'
						icon={<Inbox className='size-8 text-muted-foreground' />}
					/>
				) : (
					<ul className='divide-y'>
						{emails.map((email) => {
							const isSelected = sheetOpen && selected?.id === email.id;
							const attachmentCount = email.attachmentIds.length;
							const busy =
								(isProcessing && processId === email.id) ||
								(isMarking && markId === email.id) ||
								(isDeleting && deleteId === email.id);
							const canProcess =
								email.status === InboundEmailStatusEnum.PENDING ||
								email.status === InboundEmailStatusEnum.FAILED ||
								email.status === InboundEmailStatusEnum.PROCESSED;
							const canMark =
								email.status !== InboundEmailStatusEnum.PROCESSED &&
								email.status !== InboundEmailStatusEnum.PROCESSING;

							return (
								<li key={email.id}>
									<div
										className={cn(
											'flex w-full items-center gap-1 px-2 py-2.5 transition-colors hover:bg-muted/50',
											isSelected && 'bg-muted/60'
										)}
									>
										<button
											type='button'
											onClick={() => openEmail(email)}
											className='flex min-w-0 flex-1 items-center gap-2 px-2 text-left'
										>
											<div className='min-w-0 flex-1'>
												<div className='flex items-center gap-2'>
													<p className='min-w-0 flex-1 truncate text-sm leading-5 font-medium'>
														{email.subject || '(No subject)'}
													</p>
													<span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
														{formatReceivedAt(email.receivedAt)}
													</span>
												</div>
												<div className='mt-0.5 flex items-center gap-1.5 text-xs leading-4 text-muted-foreground'>
													<span className='truncate'>
														{extractSender(email.from)}
													</span>
													<span aria-hidden>·</span>
													<span className='inline-flex shrink-0 items-center gap-0.5'>
														<Paperclip className='size-3' />
														{attachmentCount}
													</span>
													<InboundEmailStatusBadge
														status={email.status}
														className='ml-auto text-[11px]'
													/>
												</div>
											</div>
											<ChevronRight className='size-3.5 shrink-0 text-muted-foreground/70' />
										</button>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													size='icon'
													className='size-8 shrink-0'
													disabled={busy}
													aria-label='Email actions'
												>
													{busy ? (
														<Loader2 className='size-4 animate-spin' />
													) : (
														<MoreHorizontal className='size-4' />
													)}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end' className='w-48'>
												{email.threadId ? (
													<DropdownMenuItem asChild>
														<a
															href={gmailThreadUrl(
																email.threadId,
																gmailAccount
															)}
															target='_blank'
															rel='noopener noreferrer'
														>
															<ExternalLink className='size-4' />
															Open in Gmail
														</a>
													</DropdownMenuItem>
												) : null}
												<DropdownMenuItem
													disabled={!canProcess || busy}
													onClick={() => processEmail(email.id)}
												>
													<Play className='size-4' />
													Process
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={!canMark || busy}
													onClick={() => markEmailProcessed(email.id)}
												>
													<CheckCircle2 className='size-4' />
													Mark as processed
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant='destructive'
													disabled={
														busy ||
														email.status === InboundEmailStatusEnum.PROCESSING
													}
													onClick={() => setDeleteTarget(email)}
												>
													<Trash2 className='size-4 text-destructive' />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			<InboundEmailDetailSheet
				email={selected}
				open={sheetOpen}
				onOpenChange={handleSheetOpenChange}
			/>

			<CustomAlertDialog
				isOpen={Boolean(deleteTarget)}
				onClose={() => {
					if (isDeleting) return;
					setDeleteTarget(null);
				}}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
				title={copy.deleteTitle}
				description={
					deleteTarget
						? `Remove "${deleteTarget.subject || '(No subject)'}" from the queue. This does not delete the Gmail message.`
						: undefined
				}
				cancelText='Cancel'
				confirmText='Delete'
			/>
		</>
	);
};

export default InboundEmailList;
