import { type DocEntry, type DocSection, SEARCH_RESULT_CAP } from './schema.js';

const SUMMARY_CHARS = 180;
const RESULTS_PER_DOC = 2;
const SNIPPET_CHARS = 150;
/** Characters kept before the first hit, so the snippet shows why it matched. */
const SNIPPET_LEAD = 50;
/** Results scoring below this share of the best match are noise, not alternatives. */
const MIN_RELATIVE_SCORE = 0.35;

const STOP_WORDS = new Set(
	'a an and are be by can do does for happen happens how i in is it mean means of on or our the this that to we what when which who why with work works working'.split(
		' '
	)
);

function clip(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

/** Most docs have no frontmatter description; the opening section stands in. */
function summaryOf(entry: DocEntry): string | undefined {
	if (entry.description) return entry.description;
	const opening = entry.sections.find((section) => section.text)?.text;
	return opening ? clip(opening, SUMMARY_CHARS) : undefined;
}

export function shapeDocList(index: DocEntry[]) {
	const groups = new Map<
		string,
		{ path: string; title: string; summary?: string }[]
	>();

	for (const entry of index) {
		const docs = groups.get(entry.group) ?? [];
		docs.push({
			path: entry.path,
			title: entry.title,
			summary: summaryOf(entry),
		});
		groups.set(entry.group, docs);
	}

	return {
		docCount: index.length,
		groups: [...groups].map(([group, docs]) => ({ group, docs })),
	};
}

function termsOf(query: string): string[] {
	const words = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
	const meaningful = words.filter(
		(word) => word.length > 1 && !STOP_WORDS.has(word)
	);
	return [...new Set(meaningful.length ? meaningful : words)];
}

const occurrences = (haystack: string, needle: string) =>
	haystack.split(needle).length - 1;

function scoreSection(
	entry: DocEntry,
	section: DocSection,
	terms: string[],
	phrase: string
): number {
	const title = entry.title.toLowerCase();
	const heading = (section.heading ?? '').toLowerCase();
	const text = section.text.toLowerCase();

	let score = 0;
	let matched = 0;
	for (const term of terms) {
		const inTitle = title.includes(term);
		const inHeading = heading.includes(term);
		const inText = Math.min(occurrences(text, term), 5);
		if (inTitle || inHeading || inText) matched++;
		score += (inTitle ? 4 : 0) + (inHeading ? 3 : 0) + inText;
	}
	if (!matched) return 0;

	// A section that covers every term beats one that repeats a single term.
	score *= matched / terms.length;
	if (terms.every((term) => title.includes(term))) score += 8;
	if (
		phrase.length > 3 &&
		(heading.includes(phrase) || text.includes(phrase))
	) {
		score += 5;
	}
	return score;
}

function snippetOf(text: string, terms: string[]): string {
	const lower = text.toLowerCase();
	const hit = Math.min(
		...terms.map((term) => lower.indexOf(term)).filter((at) => at >= 0)
	);
	if (!Number.isFinite(hit) || hit < SNIPPET_LEAD) {
		return clip(text, SNIPPET_CHARS);
	}

	const start = text.indexOf(' ', hit - SNIPPET_LEAD) + 1;
	return `…${clip(text.slice(start), SNIPPET_CHARS)}`;
}

export function shapeDocSearch(index: DocEntry[], query: string) {
	const terms = termsOf(query);
	const phrase = query.trim().toLowerCase();

	const hits = index
		.flatMap((entry) =>
			entry.sections.map((section) => ({
				entry,
				section,
				score: scoreSection(entry, section, terms, phrase),
			}))
		)
		.filter((hit) => hit.score > 0)
		.sort((a, b) => b.score - a.score);
	const floor = (hits[0]?.score ?? 0) * MIN_RELATIVE_SCORE;

	const perDoc = new Map<string, number>();
	const results = [];
	for (const { entry, section, score } of hits) {
		if (score < floor) break;
		const count = perDoc.get(entry.href) ?? 0;
		if (count >= RESULTS_PER_DOC) continue;
		perDoc.set(entry.href, count + 1);

		results.push({
			path: entry.path,
			section: section.heading,
			snippet: snippetOf(section.text, terms),
		});
		if (results.length === SEARCH_RESULT_CAP) break;
	}

	return {
		query,
		results,
		hint: results.length
			? 'view=read with path and section reads just that part; path alone reads the whole doc.'
			: 'No doc matched. Call view=list and pick the closest title.',
	};
}
