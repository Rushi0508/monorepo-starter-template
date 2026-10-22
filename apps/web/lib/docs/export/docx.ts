import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { markdownToDocx } from 'markdown-to-doc';
import type { DocPage } from '../source';
import { buildMarkdown } from './markdown';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LEADING_H1 = /^# .*\n/m;
const IMAGE_LINE = /^!\[([^\]]*)\]\([^)]+\)$/gm;

/**
 * Word export. Starts from the markdown export, whose links and image paths are
 * already absolute app URLs, and adds what the docx renderer doesn't: the
 * "Last verified" line and a caption under each image.
 */
export function buildDocx(page: DocPage, origin: string): Promise<Buffer> {
	const lastVerified = page.frontmatter.last_verified;
	const intro = [
		lastVerified && `*Last verified ${lastVerified}*`,
		page.description,
	]
		.filter(Boolean)
		.join('\n\n');

	const markdown = buildMarkdown(page, origin)
		.replace(LEADING_H1, (heading) =>
			intro ? `${heading}\n${intro}\n` : heading
		)
		.replace(IMAGE_LINE, (image, alt: string) =>
			alt ? `${image}\n\n*${alt}*` : image
		);

	return markdownToDocx(markdown, {
		assets: {
			resolveImage: async ({ src }) =>
				src.startsWith(`${origin}/images/`)
					? // Word can't embed SVG; diagrams keep a PNG copy next to the SVG.
						readFile(
							path.join(
								PUBLIC_DIR,
								src.slice(origin.length).replace(/\.svg$/i, '.png')
							)
						)
					: undefined,
		},
		footer: {
			show: true,
			right: { type: 'pageNumber', format: 'currentOfTotal' },
		},
	});
}
