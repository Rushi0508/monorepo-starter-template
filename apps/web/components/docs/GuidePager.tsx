import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { DocNavItem } from '@/lib/docs/source';

/**
 * Previous/next links at the foot of a doc. The order is the sidebar's, so the
 * pager walks the docs in the sequence they were meant to be read.
 */
export function GuidePager({
	previous,
	next,
}: {
	previous?: DocNavItem;
	next?: DocNavItem;
}) {
	if (!previous && !next) return null;

	return (
		<nav className='mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-2'>
			{previous ? (
				<Link
					href={previous.href}
					className='flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent'
				>
					<span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
						<ChevronLeft className='size-3' />
						Previous
					</span>
					<span className='text-sm font-medium'>{previous.title}</span>
				</Link>
			) : (
				<span />
			)}
			{next && (
				<Link
					href={next.href}
					className='flex flex-col gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:bg-accent sm:col-start-2'
				>
					<span className='inline-flex items-center justify-end gap-1 text-xs text-muted-foreground'>
						Next
						<ChevronRight className='size-3' />
					</span>
					<span className='text-sm font-medium'>{next.title}</span>
				</Link>
			)}
		</nav>
	);
}

export default GuidePager;
