'use client';

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { Clock, History } from 'lucide-react';
import { ActivityTimeline } from '@/components/general/ActivityTimeline';
import { DataLoader } from '@/components/general/DataLoader';
import EmptyMessage from '@/components/general/EmptyMessage';
import { useSkuAuditLogs } from '@/queries';

interface SkuAuditLogSheetProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export const SkuAuditLogSheet = ({ open, setOpen }: SkuAuditLogSheetProps) => {
	const { data, isLoading } = useSkuAuditLogs(open);

	const entries = data?.data ?? [];
	const totalCount = data?.totalCount ?? 0;

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side='right'
				className='flex w-full flex-col gap-0 sm:max-w-lg'
			>
				<SheetHeader>
					<SheetTitle className='flex items-center gap-2'>
						<History className='size-4' />
						Audit logs
					</SheetTitle>
					<SheetDescription>
						{totalCount > 0
							? `${totalCount} ${totalCount === 1 ? 'change' : 'changes'} to SKU settings, newest first.`
							: 'Every change to SKU settings, newest first.'}
					</SheetDescription>
				</SheetHeader>

				<div className='flex-1 overflow-y-auto px-4 pb-4'>
					{isLoading ? (
						<DataLoader message='Loading audit logs...' />
					) : entries.length === 0 ? (
						<EmptyMessage
							icon={<Clock className='size-8 text-muted-foreground' />}
							message='No activity yet'
							description='Changes to SKUs and columns will appear here.'
						/>
					) : (
						<ActivityTimeline
							items={entries.map((entry) => ({
								id: entry.id,
								activity: entry.activity,
								// updatedAt, not createdAt — a coalesced edit is stamped when
								// it last changed, which is what we sort by.
								at: entry.updatedAt,
							}))}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};
