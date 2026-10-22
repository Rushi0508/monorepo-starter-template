import path from 'node:path';
import {
	type DocFrontmatter,
	hrefFor,
	listDocFiles,
	orderFromSegment,
	parseFrontmatter,
	prettify,
	readDocFile,
	slugOf,
	stripOrderPrefix,
} from '@repo/docs';
import type { MarkdownDocument, MarkdownHeading } from '@tanstack/markdown';
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs';
import { parseMarkdown } from '@tanstack/markdown/parser';
import { cache } from 'react';

export { DOCS_BASE_PATH, prettify } from '@repo/docs';

/**
 * Build-time reader for the repo's `docs/` folder. Nothing here runs at request
 * time — every page is generated statically.
 *
 * Two conventions, both enforced by the filesystem rather than by config:
 *
 * - Folders order the sidebar by a numeric prefix: `01-business` renders as
 *   "Business", first in the list. Unprefixed folders sort last but still
 *   appear, so adding one never needs a code change.
 * - URLs mirror the folder tree with the prefixes stripped, so
 *   docs/02-features/order-visibility.md serves at /docs/features/order-visibility.
 *   Every markdown file is a page; a folder is only ever a grouping, and /docs
 *   itself is a generated index of them.
 *
 * `docs/` lives at the repo root, outside apps/web; the root turbo.json lists it
 * under globalDependencies so editing a doc busts the build cache. Finding and
 * naming the files lives in @repo/docs, shared with the MCP server.
 */

/** Markdown extensions shared by the parser and the renderer — they must match. */
export const docsExtensions = docsMarkdownExtensions();

export type DocPage = {
	/** URL segments with numeric prefixes stripped, e.g. ['features', 'stock']. */
	slug: string[];
	/** Route for this doc, e.g. '/docs/features/stock-visibility'. */
	href: string;
	/** Sidebar label — frontmatter `title`, else the H1, else the filename. */
	title: string;
	/** The document's own H1, rendered as the page heading. */
	heading: string;
	description?: string;
	order: number;
	frontmatter: DocFrontmatter;
	/** Parsed body, with the leading H1 removed — the page renders its own. */
	document: MarkdownDocument;
	/** H2/H3 only; H1 is the page title and H4+ is too deep to be useful. */
	headings: MarkdownHeading[];
	/** Path under docs/ without the extension, e.g. '02-features/stock-visibility'. */
	sourcePath: string;
};

export type DocNavItem = {
	title: string;
	href: string;
	slug: string[];
	/** False for a folder — it groups pages, it is not one. */
	hasPage: boolean;
	children: DocNavItem[];
};

/** The document's own H1, used when frontmatter supplies no title. */
const firstHeading = (document: MarkdownDocument) =>
	document.headings?.find((heading) => heading.level === 1)?.text;

/**
 * Drops a leading H1 from the body. The page renders the title itself, so
 * leaving the H1 in would print it twice.
 */
const withoutLeadingHeading = (
	document: MarkdownDocument
): MarkdownDocument => {
	const [first] = document.children;

	return first?.type === 'heading' && first.depth === 1
		? { ...document, children: document.children.slice(1) }
		: document;
};

function readDoc(sourcePath: string): DocPage {
	const raw = readDocFile(sourcePath);
	const document = parseMarkdown(raw, {
		extensions: docsExtensions,
		frontmatter: true,
		headingIds: true,
	});
	const frontmatter = parseFrontmatter(document.frontmatter);

	const fileName = sourcePath.replace(/\.md$/, '').split(path.sep).at(-1) ?? '';
	const slug = slugOf(sourcePath);

	// The H1 can stay verbose; frontmatter `title` is what keeps the sidebar
	// short. A doc that sets neither uses its filename for both.
	const heading =
		firstHeading(document) ?? prettify(stripOrderPrefix(fileName));

	return {
		slug,
		href: hrefFor(slug),
		title: frontmatter.title ?? heading,
		heading,
		description: frontmatter.description,
		order:
			frontmatter.order ??
			orderFromSegment(fileName) ??
			Number.POSITIVE_INFINITY,
		frontmatter,
		document: withoutLeadingHeading(document),
		headings: (document.headings ?? []).filter(
			(heading) => heading.level > 1 && heading.level < 4
		),
		sourcePath: sourcePath.replace(/\.md$/, ''),
	};
}

// ── Public API ───────────────────────────────────────────────────────────────

export const getDocPages = cache((): DocPage[] => listDocFiles().map(readDoc));

export const readDocSource = (page: DocPage): string =>
	readDocFile(page.sourcePath);

export const getDocPage = cache((slug: string[]): DocPage | undefined => {
	const href = hrefFor(slug);
	return getDocPages().find((page) => page.href === href);
});

/**
 * Builds the sidebar tree. Every folder becomes a section automatically —
 * prefix it to place it, or leave it unprefixed and it lands at the end.
 *
 * A folder is a grouping, never a page: it takes its label from its own name
 * and has no route of its own, so the sidebar renders it as a heading.
 */
export const getDocNav = cache((): DocNavItem[] => {
	const roots: DocNavItem[] = [];
	const byHref = new Map<string, DocNavItem>();
	const orders = new Map<string, number>();

	const ensure = (slug: string[]): DocNavItem => {
		const href = hrefFor(slug);
		const existing = byHref.get(href);
		if (existing) return existing;

		const item: DocNavItem = {
			title: prettify(slug.at(-1) ?? 'Docs'),
			href,
			slug,
			hasPage: false,
			children: [],
		};
		byHref.set(href, item);

		if (slug.length <= 1) roots.push(item);
		else ensure(slug.slice(0, -1)).children.push(item);

		return item;
	};

	for (const page of getDocPages()) {
		// Each ancestor folder takes its sort key from its own numeric prefix.
		const folders = page.sourcePath.split(path.sep).slice(0, -1);

		for (const [index, segment] of folders.entries()) {
			const href = hrefFor(page.slug.slice(0, index + 1));
			const order = orderFromSegment(segment);
			if (order !== undefined && !orders.has(href)) orders.set(href, order);
		}

		const item = ensure(page.slug);
		item.hasPage = true;
		item.title = page.title;
		orders.set(item.href, page.order);
	}

	const rank = (href: string) => orders.get(href) ?? Number.POSITIVE_INFINITY;

	const sort = (items: DocNavItem[]): DocNavItem[] =>
		items
			.map((item) => ({ ...item, children: sort(item.children) }))
			.sort(
				(a, b) => rank(a.href) - rank(b.href) || a.title.localeCompare(b.title)
			);

	return sort(roots);
});

/** Every page in sidebar order — the sequence the prev/next pager walks. */
export const getDocNavFlat = cache((): DocNavItem[] => {
	const flatten = (items: DocNavItem[]): DocNavItem[] =>
		items.flatMap((item) => [item, ...flatten(item.children)]);

	return flatten(getDocNav()).filter((item) => item.hasPage);
});

export const getDocNeighbours = cache((href: string) => {
	const flat = getDocNavFlat();
	const index = flat.findIndex((item) => item.href === href);

	return index === -1
		? { previous: undefined, next: undefined }
		: { previous: flat[index - 1], next: flat[index + 1] };
});

/**
 * Lookup tables for links written between markdown files. Docs are authored to
 * be readable on disk, so they link with relative paths like
 * `./features/order-visibility.md` — which the renderer has to turn into a
 * /docs route.
 *
 * `byPath` handles links that name a real file. `byName` is the fallback for
 * links whose relative path is wrong but whose filename is not, which is the
 * common case once a doc moves between folders. The `folder*` pair does the
 * same for links to a whole section, e.g. `./workflows/`.
 */
export const getDocLinkIndex = cache(() => {
	const byPath = new Map<string, string>();
	const byName = new Map<string, string>();

	for (const page of getDocPages()) {
		byPath.set(page.sourcePath, page.href);
		// Also accept the prefix-stripped spelling, e.g. 'features/stock'.
		byPath.set(
			page.sourcePath.split(path.sep).map(stripOrderPrefix).join('/'),
			page.href
		);

		const name = stripOrderPrefix(page.sourcePath.split(path.sep).at(-1) ?? '');
		// First writer wins, so a duplicate filename can never silently reassign
		// an existing link target.
		if (!byName.has(name)) byName.set(name, page.href);
	}

	const folderByPath = new Map<string, string>();
	const folderByName = new Map<string, string>();

	// A folder has no page of its own, so a link to one resolves to the first
	// page inside it — a section link always lands somewhere real.
	const flat = getDocNavFlat();
	const targetFor = (href: string) =>
		flat.find((item) => item.href === href || item.href.startsWith(`${href}/`))
			?.href;

	for (const page of getDocPages()) {
		const folders = page.sourcePath.split(path.sep).slice(0, -1);

		for (const index of folders.keys()) {
			const target = targetFor(hrefFor(page.slug.slice(0, index + 1)));
			if (!target) continue;

			const raw = folders.slice(0, index + 1);
			folderByPath.set(raw.join('/'), target);
			folderByPath.set(raw.map(stripOrderPrefix).join('/'), target);

			const name = stripOrderPrefix(raw.at(-1) ?? '');
			if (!folderByName.has(name)) folderByName.set(name, target);
		}
	}

	return { byPath, byName, folderByPath, folderByName };
});

export type DocLinkIndex = ReturnType<typeof getDocLinkIndex>;
