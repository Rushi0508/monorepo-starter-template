/**
 * Client-side half of docs search. The index is built at build time by
 * search-index.ts and served as static JSON; this file only reads it, so it
 * must stay free of node imports.
 */

export type DocSearchSection = {
	/** Anchor of the H2/H3 this text sits under; absent for text above the first. */
	id?: string;
	heading?: string;
	text: string;
};

export type DocSearchEntry = {
	href: string;
	title: string;
	/** Top-level folder, e.g. "Features". */
	group: string;
	description?: string;
	sections: DocSearchSection[];
};

export type DocSearchResult = {
	href: string;
	title: string;
	/** Where the match sits: the doc's group, or the doc title for a section hit. */
	context: string;
	/** Text around a body match, so the reader sees why the doc came up. */
	snippet?: string;
};

export const DOC_SEARCH_INDEX_URL = '/docs/search-index.json';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

const termsOf = (query: string) =>
	query.toLowerCase().split(/\s+/).filter(Boolean);

export const matchesAllTerms = (text: string, terms: string[]) => {
	const haystack = text.toLowerCase();
	return terms.every((term) => haystack.includes(term));
};

function snippetAround(text: string, term: string) {
	const at = text.toLowerCase().indexOf(term);
	if (at === -1) return undefined;

	const start = Math.max(0, at - 40);
	const end = Math.min(text.length, at + term.length + 80);
	return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Every query term must appear. A doc surfaces once, at its strongest match:
 * title, then description, then a section heading, then body text.
 */
export function searchDocs(
	index: DocSearchEntry[],
	query: string
): DocSearchResult[] {
	if (query.trim().length < MIN_QUERY_LENGTH) return [];
	const terms = termsOf(query);

	const scored: { score: number; result: DocSearchResult }[] = [];

	for (const doc of index) {
		const page = { href: doc.href, title: doc.title, context: doc.group };

		if (matchesAllTerms(doc.title, terms)) {
			scored.push({ score: 4, result: page });
			continue;
		}
		if (doc.description && matchesAllTerms(doc.description, terms)) {
			scored.push({ score: 3, result: { ...page, snippet: doc.description } });
			continue;
		}

		const heading = doc.sections.find(
			(section) => section.heading && matchesAllTerms(section.heading, terms)
		);
		if (heading?.heading) {
			scored.push({
				score: 2,
				result: {
					href: `${doc.href}#${heading.id}`,
					title: heading.heading,
					context: doc.title,
				},
			});
			continue;
		}

		const phrase = terms.join(' ');
		const body =
			doc.sections.find((section) =>
				section.text.toLowerCase().includes(phrase)
			) ??
			doc.sections.find((section) =>
				matchesAllTerms(`${section.heading ?? ''} ${section.text}`, terms)
			);
		if (body) {
			const snippet =
				snippetAround(body.text, phrase) ??
				snippetAround(body.text, terms[0] as string);
			scored.push({
				score: body.text.toLowerCase().includes(phrase) ? 1.5 : 1,
				result: {
					href: body.id ? `${doc.href}#${body.id}` : doc.href,
					title: doc.title,
					context: body.heading ? `${doc.group} › ${body.heading}` : doc.group,
					snippet,
				},
			});
		}
	}

	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, MAX_RESULTS)
		.map(({ result }) => result);
}
