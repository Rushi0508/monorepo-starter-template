import { resolveDocLink } from '../links';
import { type DocPage, getDocLinkIndex, readDocSource } from '../source';

const FRONTMATTER = /^---\n[\s\S]*?\n---\n+/;
const LINK = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;

/**
 * The doc's own markdown, minus frontmatter. Relative doc links and image paths
 * only resolve inside the app, so they are rewritten to absolute app URLs.
 */
export function buildMarkdown(page: DocPage, origin: string): string {
	const index = getDocLinkIndex();
	const fromDir = page.sourcePath.split('/').slice(0, -1);

	return readDocSource(page)
		.replace(FRONTMATTER, '')
		.replace(LINK, (match, bang: string, text: string, href: string) => {
			if (bang) {
				return href.startsWith('/') ? `![${text}](${origin}${href})` : match;
			}

			const link = resolveDocLink(href, fromDir, index);
			return link.kind === 'internal'
				? `[${text}](${origin}${link.href})`
				: match;
		});
}
