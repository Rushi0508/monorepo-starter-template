'use client';

import type { FileContentType, InboundEmailType } from '@repo/types';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Separator } from '@repo/ui/components/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { getExtension } from '@repo/utils';
import { format } from 'date-fns';
import {
	Braces,
	ExternalLink,
	FileText,
	ImageIcon,
	Loader2,
	Mail,
	Paperclip,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useGmailStatus } from '@/queries';
import { GmailService } from '@/services';
import { gmailThreadUrl } from '@/utils/get-urls';
import GmailBody from './GmailBody';
import { InboundEmailStatusBadge } from './InboundEmailStatusBadge';

interface InboundEmailDetailSheetProps {
	email: InboundEmailType | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function fileIcon(mimeType: string | undefined) {
	if (mimeType?.startsWith('image/')) {
		return <ImageIcon className='size-4 shrink-0 text-muted-foreground' />;
	}
	return <FileText className='size-4 shrink-0 text-muted-foreground' />;
}

function fileTypeLabel(mimeType: string | undefined): string {
	if (!mimeType) return 'File';
	return getExtension(mimeType as FileContentType).toUpperCase();
}

function hasExtractedData(data: InboundEmailType['extractedData']): boolean {
	return data != null && !(Array.isArray(data) && data.length === 0);
}

export const InboundEmailDetailSheet = ({
	email,
	open,
	onOpenChange,
}: InboundEmailDetailSheetProps) => {
	const [openingId, setOpeningId] = useState<string | null>(null);
	const { data: gmailStatus } = useGmailStatus();
	const gmailAccount = gmailStatus?.email ?? null;

	const openAttachment = async (attachmentId: string) => {
		if (!email) return;
		setOpeningId(attachmentId);
		try {
			const blob = await GmailService.getAttachmentBlob(email.id, attachmentId);
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank', 'noopener,noreferrer');
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to open attachment'
			);
		} finally {
			setOpeningId(null);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl'>
				{!email ? null : (
					<>
						<div className='border-b px-4 py-4 pr-12'>
							<SheetHeader className='gap-3 space-y-0 p-0 text-left'>
								<div className='flex items-start justify-between gap-3'>
									<SheetTitle className='font-sans text-base leading-snug font-semibold'>
										{email.subject || '(No subject)'}
									</SheetTitle>
									<InboundEmailStatusBadge
										status={email.status}
										className='shrink-0'
									/>
								</div>
								<SheetDescription className='sr-only'>
									Email details and attachments
								</SheetDescription>
							</SheetHeader>

							<dl className='mt-3 space-y-1.5 text-sm'>
								<div className='flex gap-3'>
									<dt className='w-14 shrink-0 text-muted-foreground'>From</dt>
									<dd className='min-w-0 truncate font-medium'>
										{email.from || '—'}
									</dd>
								</div>
								<div className='flex gap-3'>
									<dt className='w-14 shrink-0 text-muted-foreground'>Date</dt>
									<dd>
										{email.receivedAt
											? format(
													new Date(email.receivedAt),
													'MMM d, yyyy · h:mm a'
												)
											: '—'}
									</dd>
								</div>
								<div className='flex gap-3'>
									<dt className='w-14 shrink-0 text-muted-foreground'>Files</dt>
									<dd>
										{email.attachmentIds.length} attachment
										{email.attachmentIds.length === 1 ? '' : 's'}
									</dd>
								</div>
							</dl>

							{email.threadId ? (
								<a
									href={gmailThreadUrl(email.threadId, gmailAccount)}
									target='_blank'
									rel='noopener noreferrer'
									className='mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 underline hover:text-blue-800'
									title={
										gmailAccount
											? `Open in Gmail (${gmailAccount})`
											: 'Open in Gmail'
									}
								>
									Open in Gmail
									<ExternalLink className='size-3.5' />
								</a>
							) : null}
						</div>

						<div className='space-y-5 px-4 py-4'>
							<section>
								<div className='mb-2.5 flex items-center gap-2'>
									<Paperclip className='size-4 text-muted-foreground' />
									<h3 className='text-sm font-semibold'>Attachments</h3>
								</div>
								{email.attachmentIds.length === 0 ? (
									<p className='text-sm text-muted-foreground'>
										No attachments on this email.
									</p>
								) : (
									<ul className='divide-y rounded-lg border'>
										{email.attachmentIds.map((attachmentId, index) => {
											const filename =
												email.filenames[index] ?? `attachment-${index + 1}`;
											const mimeType = email.mimeTypes[index];
											const isOpening = openingId === attachmentId;

											return (
												<li key={attachmentId}>
													<button
														type='button'
														onClick={() => openAttachment(attachmentId)}
														disabled={isOpening}
														className='flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-60'
													>
														{fileIcon(mimeType)}
														<div className='min-w-0 flex-1'>
															<p className='truncate text-sm font-medium'>
																{filename}
															</p>
															<p className='truncate text-xs text-muted-foreground'>
																{fileTypeLabel(mimeType)}
															</p>
														</div>
														{isOpening ? (
															<Loader2 className='size-4 shrink-0 animate-spin text-muted-foreground' />
														) : (
															<ExternalLink className='size-4 shrink-0 text-muted-foreground' />
														)}
													</button>
												</li>
											);
										})}
									</ul>
								)}
							</section>

							<Separator />

							<section>
								<Accordion type='single' collapsible className='w-full'>
									<AccordionItem value='extracted-data' className='border-none'>
										<AccordionTrigger className='py-0 hover:no-underline'>
											<span className='flex items-center gap-2'>
												<Braces className='size-4 text-muted-foreground' />
												<span className='text-sm font-semibold'>
													Extracted Data
												</span>
											</span>
										</AccordionTrigger>
										<AccordionContent className='pt-2.5 pb-0'>
											{hasExtractedData(email.extractedData) ? (
												<pre className='max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap'>
													{JSON.stringify(email.extractedData, null, 2)}
												</pre>
											) : (
												<p className='text-sm text-muted-foreground'>
													No extracted data yet. Runs after OCR on process.
												</p>
											)}
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</section>

							<Separator />

							<section>
								<div className='mb-2.5 flex items-center gap-2'>
									<Mail className='size-4 text-muted-foreground' />
									<h3 className='text-sm font-semibold'>Message</h3>
								</div>
								{email.body ? (
									<GmailBody html={email.body} />
								) : email.snippet ? (
									<GmailBody html={email.snippet} />
								) : (
									<p className='text-sm text-muted-foreground'>
										No message body available.
									</p>
								)}
							</section>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
};
