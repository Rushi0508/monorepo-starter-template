import fs from 'node:fs';
import path from 'node:path';

/**
 * The repo's `docs/` folder, read straight from disk and rendered by the web
 * app, which decides which docs exist and what URL each one lives at.
 *
 * The web app runs with apps/web as the working directory, which puts `docs/`
 * two levels up.
 */
export const DOCS_ROOT = path.join(process.cwd(), '..', '..', 'docs');

export const DOCS_BASE_PATH = '/docs';

/** Leading `01-` on a folder or file name: sort key, stripped from the URL. */
const ORDER_PREFIX = /^(\d+)[-_]/;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export const stripOrderPrefix = (segment: string) =>
	segment.replace(ORDER_PREFIX, '');

export const orderFromSegment = (segment: string) => {
	const match = ORDER_PREFIX.exec(segment);
	return match ? Number(match[1]) : undefined;
};

export function prettify(name: string): string {
	return name
		.split('-')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/** URL segments for a doc, e.g. '02-features/order-visibility' → ['features', 'order-visibility']. */
export const slugOf = (sourcePath: string) =>
	sourcePath.replace(/\.md$/, '').split(path.sep).map(stripOrderPrefix);

export const hrefFor = (slug: string[]) =>
	slug.length ? `${DOCS_BASE_PATH}/${slug.join('/')}` : DOCS_BASE_PATH;

/** Every .md path under docs/, relative to DOCS_ROOT, sorted for stable output. */
export function listDocFiles(dir = DOCS_ROOT): string[] {
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir, { withFileTypes: true })
		.flatMap((entry) => {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) return listDocFiles(full);
			if (entry.isFile() && entry.name.endsWith('.md')) {
				return [path.relative(DOCS_ROOT, full)];
			}
			return [];
		})
		.sort();
}

/** Raw file contents; `sourcePath` is relative to docs/, with or without `.md`. */
export const readDocFile = (sourcePath: string): string =>
	fs.readFileSync(
		path.join(
			DOCS_ROOT,
			sourcePath.endsWith('.md') ? sourcePath : `${sourcePath}.md`
		),
		'utf8'
	);

/** Separates the frontmatter block from the markdown body. */
export function splitFrontmatter(raw: string): {
	frontmatter?: string;
	body: string;
} {
	const match = FRONTMATTER.exec(raw);
	return match
		? { frontmatter: match[1], body: raw.slice(match[0].length) }
		: { body: raw };
}

export type DocFrontmatter = {
	/** Short sidebar label. Falls back to the document's H1. */
	title?: string;
	/** One-line summary, rendered under the page heading. */
	description?: string;
	/** Position within its section; lower first. Unset sorts last. */
	order?: number;
	/** ISO date the page was last checked against the running system. */
	last_verified?: string;
};

const KEY_VALUE = /^([a-z_][\w-]*)\s*:\s*(.*)$/;

const unquote = (value: string) => value.replace(/^['"]|['"]$/g, '').trim();

/**
 * These docs only ever use `key: value` lines, so a line-wise parser is enough
 * and keeps YAML out of the dependency tree. A file with no frontmatter is
 * valid — it falls back to its H1 and sorts last.
 */
export function parseFrontmatter(raw: string | undefined): DocFrontmatter {
	if (!raw) return {};

	const frontmatter: DocFrontmatter = {};

	for (const line of raw.split('\n')) {
		const pair = KEY_VALUE.exec(line.trim());
		if (!pair?.[1]) continue;

		const value = unquote(pair[2] ?? '');
		if (value === '') continue;

		if (pair[1] === 'title') frontmatter.title = value;
		if (pair[1] === 'description') frontmatter.description = value;
		if (pair[1] === 'last_verified') frontmatter.last_verified = value;
		if (pair[1] === 'order') {
			const order = Number.parseInt(value, 10);
			if (!Number.isNaN(order)) frontmatter.order = order;
		}
	}

	return frontmatter;
}
