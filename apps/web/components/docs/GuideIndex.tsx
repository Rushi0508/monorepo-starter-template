import Link from 'next/link';
import type { DocNavItem } from '@/lib/docs/source';

/**
 * The /docs landing page, generated from the folder tree, so the docs root is a
 * real page rather than a redirect into whichever doc happens to sort first.
 *
 * Adding a folder or a file changes this page with no code change.
 */
export function GuideIndex({ nav }: { nav: DocNavItem[] }) {
	return (
		<div className='space-y-8'>
			{nav.map((section) => (
				<section key={section.href}>
					<h2 className='mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
						{section.title}
					</h2>
					<ul className='grid gap-2 sm:grid-cols-2 md:grid-cols-3'>
						{section.children.map((page) => (
							<li key={page.href}>
								<Link
									href={page.href}
									className='block rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent'
								>
									{page.title}
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}

export default GuideIndex;
