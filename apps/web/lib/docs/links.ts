import type { DocLinkIndex } from './source';
import { DOCS_BASE_PATH } from './source';

/**
 * Classifies and rewrites a link found inside a markdown doc.
 *
 * Docs are written to read correctly on disk, so they link to each other with
 * relative paths — './rules.md', '../rules.md', './business/rules.md'. None of
 * those are routes, so they have to be mapped onto /docs before they reach the
 * browser: left alone, '../rules.md' resolves against the current URL and 404s.
 *
 * Resolution tries the literal path first, then falls back to the filename
 * alone. The fallback is what keeps links working when a doc moves between
 * folders — and what forgives a path that was never right to begin with.
 */

export type DocLink =
	| { kind: 'anchor'; href: string }
	| { kind: 'external'; href: string }
	| { kind: 'internal'; href: string };

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Collapses '.' and '..' against the directory the link was written in. */
function resolveRelative(from: string[], target: string): string {
	const segments = [...from];

	for (const segment of target.split('/')) {
		if (segment === '' || segment === '.') continue;
		if (segment === '..') segments.pop();
		else segments.push(segment);
	}

	return segments.join('/');
}

export function resolveDocLink(
	href: string,
	/** Directory of the doc containing the link, relative to docs/. */
	fromDir: string[],
	index: DocLinkIndex
): DocLink {
	// In-page anchor — must not become a /docs route or an external link.
	if (href.startsWith('#')) return { kind: 'anchor', href };

	// Anything with a scheme (http:, mailto:) leaves the app.
	if (HAS_SCHEME.test(href) || href.startsWith('//')) {
		return { kind: 'external', href };
	}

	// Already a route.
	if (href.startsWith('/')) return { kind: 'internal', href };

	const [rawPath = '', hash] = href.split('#');
	const withHash = (target: string) => (hash ? `${target}#${hash}` : target);

	// A bare '#anchor' arrives above; this is a link to the docs root itself.
	const trimmed = rawPath.replace(/\/+$/, '');
	if (trimmed === '' || trimmed === '.') {
		return { kind: 'internal', href: withHash(DOCS_BASE_PATH) };
	}

	const withoutExtension = trimmed.replace(/\.md$/, '');
	const absolute = resolveRelative(fromDir, withoutExtension);

	const byPath = index.byPath.get(absolute);
	if (byPath) return { kind: 'internal', href: withHash(byPath) };

	const name = absolute.split('/').at(-1) ?? '';
	const byName = index.byName.get(name);
	if (byName) return { kind: 'internal', href: withHash(byName) };

	// No file matched, so try the same two lookups against section folders —
	// 'Workflows' is commonly linked as './workflows/'.
	const folder =
		index.folderByPath.get(absolute) ?? index.folderByName.get(name);
	if (folder) return { kind: 'internal', href: withHash(folder) };

	// Unresolvable — send the reader to the docs root rather than a dead URL.
	return { kind: 'internal', href: withHash(DOCS_BASE_PATH) };
}
