import { cn } from '@repo/ui/lib/utils';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface DocLinkProps {
	/** Doc path under /docs, number prefixes stripped, e.g. `business/calculations` */
	doc: string;
	/** Heading anchor to land on, e.g. `costs` for "## Costs" */
	section?: string;
	children: ReactNode;
	className?: string;
}

/** A link into the docs, opened in a new tab so the page stays as it was. */
export function DocLink({ doc, section, children, className }: DocLinkProps) {
	return (
		<Link
			href={`/docs/${doc}${section ? `#${section}` : ''}`}
			target='_blank'
			rel='noopener noreferrer'
			className={cn(
				'inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline',
				className
			)}
		>
			<BookOpen className='size-3.5' />
			{children}
		</Link>
	);
}
