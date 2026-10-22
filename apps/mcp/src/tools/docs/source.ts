import path from 'node:path';
import {
	hrefFor,
	listDocFiles,
	parseFrontmatter,
	prettify,
	readDocFile,
	slugOf,
	splitFrontmatter,
	stripOrderPrefix,
} from '@repo/docs';
import type { DocEntry, DocSection } from './schema.js';

/**
 * Doc links handed to the model point at the web app, which is served from the
 * same host as this server in production.
 */
export const APP_ORIGIN = new URL(
	process.env['MCP_PUBLIC_URL'] ?? 'http://localhost:3000'
).origin;

const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^\s*(```|~~~)/;
const LINK = /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g;

/** Markdown → plain text, good enough for matching and snippets. */
const plain = (markdown: string) =>
	markdown
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s*\|?[\s:-]*\|[\s|:-]*$/gm, ' ')
		.replace(/[*_`|>]/g, ' ')
		.replace(/^\s*(?:[-+]|\d+\.)\s+/gm, ' ')
		.replace(/\s+/g, ' ')
		.trim();

/**
 * Heading anchors exactly as the web app's markdown parser (@tanstack/markdown)
 * makes them, so a cited `#section` link lands on the right heading. Repeats
 * are numbered across every heading in the doc, H1 included.
 */
function createSlugger() {
	const seen = new Map<string, number>();
	return (value: string) => {
		const base =
			value
				.toLowerCase()
				.normalize('NFKD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/&[a-z0-9#]+;/gi, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '') || 'section';
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		return count === 0 ? base : `${base}-${count + 1}`;
	};
}

/** Splits the body at its H2/H3s, the same headings the web TOC anchors to. */
function sectionsOf(body: string): DocSection[] {
	const sections: DocSection[] = [];
	const slug = createSlugger();
	let current: { heading?: string; id?: string; lines: string[] } = {
		lines: [],
	};
	let inFence = false;

	const flush = () => {
		const text = plain(current.lines.join('\n'));
		if (current.heading || text) {
			sections.push({ heading: current.heading, id: current.id, text });
		}
	};

	for (const line of body.split('\n')) {
		if (FENCE.test(line)) inFence = !inFence;
		const heading = inFence ? null : HEADING.exec(line);

		if (heading) {
			const text = plain(heading[2] ?? '');
			const id = slug(text);
			if (heading[1] === '#') continue;
			if (heading[1] === '##' || heading[1] === '###') {
				flush();
				current = { heading: text, id, lines: [] };
				continue;
			}
		}
		current.lines.push(line);
	}
	flush();

	return sections;
}

export function loadDocs(): DocEntry[] {
	return listDocFiles().map((sourcePath) => {
		const { frontmatter, body } = splitFrontmatter(readDocFile(sourcePath));
		const meta = parseFrontmatter(frontmatter);
		const slug = slugOf(sourcePath);
		const h1 = /^#\s+(.+)$/m.exec(body)?.[1]?.trim();

		return {
			path: slug.join('/'),
			href: hrefFor(slug),
			sourcePath,
			title: meta.title ?? h1 ?? prettify(slug.at(-1) ?? ''),
			group: prettify(slug[0] ?? 'Docs'),
			description: meta.description,
			lastVerified: meta.last_verified,
			body,
			sections: sectionsOf(body),
		};
	});
}

/**
 * Docs link to each other with paths that only make sense on disk
 * (`../business-rules.md#rule-13`); turn those, and image paths, into app URLs.
 * A path that no longer matches falls back to a doc with the same file name.
 */
export function withAppLinks(
	doc: DocEntry,
	docs: DocEntry[],
	markdown = doc.body
): string {
	const fromDir = path.posix.dirname(doc.sourcePath.split(path.sep).join('/'));

	return markdown.replace(
		LINK,
		(match, bang: string, text: string, href: string) => {
			if (href.startsWith('/')) return `${bang}[${text}](${APP_ORIGIN}${href})`;
			if (bang || /^[a-z][a-z0-9+.-]*:|^#/i.test(href)) return match;

			const [target = '', hash] = href.split('#');
			const resolved = path.posix
				.normalize(path.posix.join(fromDir, target))
				.replace(/\.md$/, '')
				.replace(/\/$/, '')
				.split('/')
				.map(stripOrderPrefix)
				.join('/');
			const name = resolved.split('/').at(-1);
			const found =
				docs.find((entry) => entry.path === resolved) ??
				docs.find((entry) => entry.path.split('/').at(-1) === name);

			return found
				? `[${text}](${APP_ORIGIN}${found.href}${hash ? `#${hash}` : ''})`
				: text;
		}
	);
}

/**
 * One section of a doc as markdown: its heading down to the next heading of
 * the same or a higher level, so an H2 brings its H3s with it. Matches the
 * heading text or its anchor, case-insensitively.
 */
export function sectionOf(
	doc: DocEntry,
	wanted: string
): { heading: string; id: string; markdown: string } | undefined {
	const target = wanted.trim().replace(/^#/, '').toLowerCase();
	const lines = doc.body.split('\n');
	const slug = createSlugger();
	let inFence = false;
	let start = -1;
	let level = 0;
	let heading = '';
	let id = '';

	for (const [index, line] of lines.entries()) {
		if (FENCE.test(line)) inFence = !inFence;
		const match = inFence ? null : HEADING.exec(line);
		if (!match?.[1]) continue;

		if (start >= 0 && match[1].length <= level) {
			return {
				heading,
				id,
				markdown: lines.slice(start, index).join('\n').trim(),
			};
		}

		const text = plain(match[2] ?? '');
		const anchor = slug(text);
		if (start < 0 && (text.toLowerCase() === target || anchor === target)) {
			start = index;
			level = match[1].length;
			heading = text;
			id = anchor;
		}
	}

	return start >= 0
		? { heading, id, markdown: lines.slice(start).join('\n').trim() }
		: undefined;
}
