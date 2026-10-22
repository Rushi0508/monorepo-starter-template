'use client';

import { cn } from '@repo/ui/lib/utils';
import { useLayoutEffect, useRef, useState } from 'react';

type ClampedTextProps = Readonly<{
	text: string;
	className?: string;
}>;

export function ClampedText({ text, className }: ClampedTextProps) {
	const ref = useRef<HTMLParagraphElement>(null);
	const [expanded, setExpanded] = useState(false);
	const [overflows, setOverflows] = useState(false);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () => {
			if (!expanded) setOverflows(el.scrollHeight > el.clientHeight);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, [expanded]);

	return (
		<div className={className}>
			<p
				ref={ref}
				className={cn(
					'whitespace-pre-line text-sm text-muted-foreground',
					!expanded && 'line-clamp-3'
				)}
			>
				{text}
			</p>
			{(overflows || expanded) && (
				<button
					type='button'
					aria-expanded={expanded}
					onClick={(event) => {
						event.stopPropagation();
						setExpanded((value) => !value);
					}}
					className='mt-1 text-xs font-medium text-foreground hover:underline'
				>
					{expanded ? 'Show less' : 'Show more'}
				</button>
			)}
		</div>
	);
}
