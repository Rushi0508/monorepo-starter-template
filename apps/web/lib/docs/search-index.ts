import type { DocSearchEntry, DocSearchSection } from './search';
import { getDocPages, prettify } from './source';

type Node = {
	type: string;
	depth?: number;
	id?: string;
	value?: unknown;
	children?: Node[];
	items?: Node[];
	header?: Node[];
	rows?: Node[][];
};

// Lists and tables hold their content outside `children`.
const textOf = (node: Node): string =>
	typeof node.value === 'string'
		? node.value
		: [
				...(node.children ?? []),
				...(node.items ?? []),
				...(node.header ?? []),
				...(node.rows ?? []).flat(),
			]
				.map(textOf)
				.join(' ');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Splits a doc's body at its H2/H3s, the same headings the TOC anchors to. */
function sectionsOf(children: Node[]): DocSearchSection[] {
	const sections: DocSearchSection[] = [];
	let current: DocSearchSection = { text: '' };

	for (const node of children) {
		if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
			if (current.heading || current.text) sections.push(current);
			current = { id: node.id, heading: squash(textOf(node)), text: '' };
		} else {
			current.text += ` ${textOf(node)}`;
		}
	}
	if (current.heading || current.text) sections.push(current);

	return sections.map((section) => ({
		...section,
		text: squash(section.text),
	}));
}

export function getDocSearchIndex(): DocSearchEntry[] {
	return getDocPages().map((page) => ({
		href: page.href,
		title: page.title,
		group: prettify(page.slug[0] ?? 'Docs'),
		description: page.description,
		sections: sectionsOf(page.document.children as Node[]),
	}));
}
