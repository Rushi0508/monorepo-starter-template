import type { ToolDef } from '../types.js';
import { type DocsInput, type DocsView, docsInputSchema } from './schema.js';
import { shapeDocList, shapeDocSearch } from './shape.js';
import { APP_ORIGIN, loadDocs, sectionOf, withAppLinks } from './source.js';

/**
 * Accepts "features/order-visibility", "/docs/…", a full doc URL, or a .md
 * path. A trailing #anchor names a section.
 */
function parsePath(raw: string): { path: string; anchor?: string } {
	const [withoutHash = '', anchor] = raw.trim().split('#');
	const path = withoutHash
		.replace(/^https?:\/\/[^/]+/, '')
		.replace(/\?.*$/, '')
		.replace(/^\/?docs\//, '')
		.replace(/^\/+|\/+$/g, '')
		.replace(/\.md$/, '');

	return { path, anchor: anchor || undefined };
}

export const docsTool: ToolDef = {
	name: 'get_docs',
	description:
		"Sauero's own documentation: how each feature, screen, workflow and automation works, business rules (e.g. Rule 13), calculations and metric definitions, limitations, glossary, and setup guides. Use for any how/why/what-does-it-mean question, and before explaining a number. view=search with query first; if nothing fits, view=list and pick the closest titles. Then view=read with path — add section (a heading from search) to read only that part, which is usually enough. Answer from what you read and cite its url. Not for live figures (use the data tools). Read-only.",
	inputSchema: docsInputSchema,
	handler: async (_client, input) => {
		const parsed = input as DocsInput;
		const view: DocsView = parsed.view ?? 'list';
		const docs = loadDocs();

		if (view === 'search') {
			if (!parsed.query?.trim()) throw new Error('view=search needs a query.');
			return shapeDocSearch(docs, parsed.query);
		}

		if (view === 'read') {
			if (!parsed.path) throw new Error('view=read needs a path.');
			const { path, anchor } = parsePath(parsed.path);
			const doc = docs.find((entry) => entry.path === path);
			if (!doc) {
				throw new Error(
					`No doc at "${path}". Call get_docs with view=list for the valid paths.`
				);
			}

			const wanted = parsed.section ?? anchor;
			if (!wanted) {
				return {
					path: doc.path,
					title: doc.title,
					lastVerified: doc.lastVerified,
					url: `${APP_ORIGIN}${doc.href}`,
					markdown: withAppLinks(doc, docs),
				};
			}

			const section = sectionOf(doc, wanted);
			if (!section) {
				const headings = doc.sections.flatMap((s) => s.heading ?? []);
				throw new Error(
					`No section "${wanted}" in ${doc.path}. Sections: ${headings.join('; ')}`
				);
			}
			return {
				path: doc.path,
				title: doc.title,
				section: section.heading,
				lastVerified: doc.lastVerified,
				url: `${APP_ORIGIN}${doc.href}#${section.id}`,
				markdown: withAppLinks(doc, docs, section.markdown),
			};
		}

		return shapeDocList(docs);
	},
};
