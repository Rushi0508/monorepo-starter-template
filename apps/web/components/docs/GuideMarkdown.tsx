import type { MarkdownDocument } from '@tanstack/markdown';
import { Markdown, type MarkdownComponents } from '@tanstack/markdown/react';
import Link from 'next/link';
import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from 'react';
import { resolveDocLink } from '@/lib/docs/links';
import { type DocLinkIndex, docsExtensions } from '@/lib/docs/source';
import { GuideImage } from './GuideImage';

/**
 * Renders a parsed doc. This stays a Server Component — the markdown is parsed
 * at build time and only the pieces that need interactivity (image zoom) ship
 * as client components.
 *
 * Element styling comes from the shared `.typeset` stylesheet rather than a
 * per-element component map, so only the elements that need real behaviour are
 * overridden here.
 */

const isImage = (
	node: ReactNode
): node is ReactElement<{ src?: string; alt?: string }> =>
	isValidElement(node) && node.type === 'img';

function buildComponents(index: DocLinkIndex, fromDir: string[]) {
	return {
		a: ({ href, children, ...props }) => {
			if (!href) return <span {...props}>{children}</span>;

			const link = resolveDocLink(href, fromDir, index);

			if (link.kind === 'internal') {
				return (
					<Link {...props} href={link.href}>
						{children}
					</Link>
				);
			}

			if (link.kind === 'anchor') {
				return (
					<a {...props} href={link.href}>
						{children}
					</a>
				);
			}

			return (
				<a
					{...props}
					href={link.href}
					target='_blank'
					rel='noopener noreferrer'
				>
					{children}
				</a>
			);
		},
		// Wide tables scroll inside their own container rather than the page.
		table: (props) => (
			<div className='typeset-scroll'>
				<table {...props} />
			</div>
		),
		// A paragraph holding nothing but an image becomes a zoomable figure.
		p: ({ children, ...props }) => {
			const content = Children.toArray(children).filter(
				(child) => typeof child !== 'string' || child.trim()
			);
			const image = content.length === 1 ? content[0] : undefined;

			if (!isImage(image) || !image.props.src) {
				return <p {...props}>{children}</p>;
			}

			return <GuideImage src={image.props.src} alt={image.props.alt} />;
		},
	} satisfies MarkdownComponents;
}

export function GuideMarkdown({
	document,
	linkIndex,
	fromDir,
}: {
	document: MarkdownDocument;
	linkIndex: DocLinkIndex;
	fromDir: string[];
}) {
	return (
		<div className='typeset guide-typeset'>
			<Markdown
				extensions={docsExtensions}
				components={buildComponents(linkIndex, fromDir)}
			>
				{document}
			</Markdown>
		</div>
	);
}

export default GuideMarkdown;
