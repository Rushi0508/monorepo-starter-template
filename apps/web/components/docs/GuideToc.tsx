'use client';

import { cn } from '@repo/ui/lib/utils';
import type { MarkdownHeading } from '@tanstack/markdown';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Nearest ancestor that actually scrolls — the docs page, not the window. */
function scrollParent(element: HTMLElement | null): HTMLElement | null {
	for (let node = element?.parentElement; node; node = node.parentElement) {
		const { overflowY } = getComputedStyle(node);
		if (overflowY === 'auto' || overflowY === 'scroll') return node;
	}
	return null;
}

/**
 * Marks whichever heading is nearest the top of the viewport. The rootMargin
 * ignores the header and the bottom 70% of the screen, so the active entry
 * tracks what the reader is looking at rather than what is merely visible.
 */
function useActiveHeading(headings: MarkdownHeading[]) {
	const [activeId, setActiveId] = useState<string | undefined>(headings[0]?.id);

	// Which headings are currently inside the band. An observer callback only
	// reports headings whose visibility *changed*, so picking the topmost of
	// just those flickers through the wrong ones during a jump.
	const visible = useRef(new Set<string>());

	// A click pins its own heading: a smooth scroll crosses every heading on the
	// way, and the reader should see the destination highlighted, not the trip.
	const pinned = useRef(false);
	const release = useRef<() => void>(undefined);

	useEffect(() => {
		const elements = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((element): element is HTMLElement => element !== null);

		if (!elements.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.current.add(entry.target.id);
					else visible.current.delete(entry.target.id);
				}

				if (pinned.current) return;

				// `headings` is in document order, so the first still-visible one is
				// the topmost. Nothing visible leaves the last heading marked, which
				// is what a reader mid-section expects.
				const top = headings.find((heading) => visible.current.has(heading.id));
				if (top) setActiveId(top.id);
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }
		);

		for (const element of elements) observer.observe(element);

		return () => {
			observer.disconnect();
			visible.current.clear();
			release.current?.();
		};
	}, [headings]);

	const pinTo = useCallback((id: string) => {
		release.current?.();
		pinned.current = true;
		setActiveId(id);

		const container = scrollParent(document.getElementById(id));

		const unpin = () => {
			pinned.current = false;
			clearTimeout(timer);
			container?.removeEventListener('scrollend', unpin);
			release.current = undefined;
		};

		// scrollend fires once the smooth scroll settles; the timeout covers
		// browsers without it and a click that scrolls nowhere.
		const timer = setTimeout(unpin, 1000);
		container?.addEventListener('scrollend', unpin, { once: true });
		release.current = unpin;
	}, []);

	return { activeId, pinTo };
}

export function GuideToc({ headings }: { headings: MarkdownHeading[] }) {
	const { activeId, pinTo } = useActiveHeading(headings);

	if (!headings.length) return null;

	return (
		<nav aria-label='On this page' className='text-sm'>
			<p className='mb-3 font-medium text-foreground'>On this page</p>
			<ul className='space-y-2 border-l border-border/70'>
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							// The browser still performs the jump and sets the hash; this
							// only fixes which entry lights up while it happens.
							onClick={() => pinTo(heading.id)}
							className={cn(
								'-ml-px block border-l py-0.5 transition-colors hover:text-foreground',
								heading.level > 2 ? 'pl-6' : 'pl-3',
								heading.id === activeId
									? 'border-primary text-foreground'
									: 'border-transparent text-muted-foreground'
							)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default GuideToc;
