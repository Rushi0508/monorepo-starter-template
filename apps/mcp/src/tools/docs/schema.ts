import { z } from 'zod';

export const SEARCH_RESULT_CAP = 5;

export const docsViews = ['list', 'search', 'read'] as const;

export const docsInputSchema = z.object({
	view: z
		.enum(docsViews)
		.optional()
		.describe(
			'list (default): every doc with a one-line summary. search: needs query. read: needs path'
		),
	query: z
		.string()
		.optional()
		.describe(
			'Search: words to look for, e.g. "order visibility" or "Rule 13"'
		),
	path: z
		.string()
		.optional()
		.describe(
			'Read: doc path from list or search, e.g. "features/order-visibility"'
		),
	section: z
		.string()
		.optional()
		.describe(
			'Read: one section heading from search, e.g. "Delivery performance". Omit for the whole doc'
		),
});

export type DocsInput = z.infer<typeof docsInputSchema>;
export type DocsView = (typeof docsViews)[number];

export type DocSection = { id?: string; heading?: string; text: string };

export type DocEntry = {
	/** e.g. 'features/order-visibility' — what view=read takes. */
	path: string;
	/** App route, e.g. '/docs/features/order-visibility'. */
	href: string;
	/** Path under docs/ as it is on disk, e.g. '02-features/order-visibility.md'. */
	sourcePath: string;
	title: string;
	group: string;
	description?: string;
	lastVerified?: string;
	/** Markdown without frontmatter. */
	body: string;
	/** Plain text split at the H2/H3s. */
	sections: DocSection[];
};
