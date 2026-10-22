'use client';

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@repo/ui/components/sheet';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ScrollText } from 'lucide-react';
import { ActivityTimeline } from '@/components/general/ActivityTimeline';
import { usePlanAudits } from '@/queries';

/**
 * Everything that has happened to a plan, newest first.
 *
 * A plan's numbers are computed rather than stored, so the audit trail is the
 * only record of *why* it looks the way it does — who changed a method, who
 * overrode a cell, who signed it off.
 */
export const AuditLogSheet = ({
	planId,
	open,
	onClose,
}: {
	planId: string | null;
	open: boolean;
	onClose: () => void;
}) => {
	const { data: audits = [], isLoading } = usePlanAudits(open ? planId : null);

	return (
		<Sheet open={open} onOpenChange={(next) => !next && onClose()}>
			<SheetContent className='w-full gap-0 overflow-y-auto sm:max-w-md'>
				<SheetHeader>
					<SheetTitle>Activity</SheetTitle>
					<SheetDescription>
						Every change made to this plan, newest first.
					</SheetDescription>
				</SheetHeader>

				<div className='px-4 pb-8'>
					{isLoading && (
						<div className='space-y-2'>
							<Skeleton className='h-12 w-full' />
							<Skeleton className='h-12 w-full' />
							<Skeleton className='h-12 w-full' />
						</div>
					)}

					{!isLoading && audits.length === 0 && (
						<div className='flex flex-col items-center gap-2 py-12 text-center'>
							<ScrollText className='size-7 text-muted-foreground' />
							<p className='text-sm text-muted-foreground'>
								Nothing recorded yet.
							</p>
						</div>
					)}

					<ActivityTimeline
						items={audits.map((audit) => ({
							id: audit.id,
							activity: audit.activity,
							at: audit.createdAt,
						}))}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default AuditLogSheet;
