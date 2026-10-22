import fs from 'node:fs';
import path from 'node:path';
import {
	Document,
	Font,
	Image,
	Link,
	Page,
	renderToBuffer,
	StyleSheet,
	Text,
	View,
} from '@react-pdf/renderer';
import type { BlockNode, InlineNode } from '@tanstack/markdown';
import { imageSize } from 'image-size';
import type { ReactNode } from 'react';
import { resolveDocLink } from '../links';
import { type DocPage, getDocLinkIndex } from '../source';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FONT_DIR = path.join(
	process.cwd(),
	'node_modules',
	'dejavu-fonts-ttf',
	'ttf'
);

const PAGE_MARGIN = 48;
/** A4 width in points, less both margins. */
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2;

const TEXT = '#1f1f1f';
const MUTED = '#6b6b6b';
const BORDER = '#d9d9d9';
const LINK = '#2563eb';

// The built-in PDF fonts are Latin-1 only; the docs use arrows and box-drawing
// characters, so a full Unicode family is embedded instead.
Font.register({
	family: 'DejaVu',
	fonts: [
		{ src: path.join(FONT_DIR, 'DejaVuSans.ttf') },
		{ src: path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'), fontWeight: 'bold' },
		{ src: path.join(FONT_DIR, 'DejaVuSans-Oblique.ttf'), fontStyle: 'italic' },
		{
			src: path.join(FONT_DIR, 'DejaVuSans-BoldOblique.ttf'),
			fontWeight: 'bold',
			fontStyle: 'italic',
		},
	],
});
Font.register({
	family: 'DejaVuMono',
	fonts: [
		{ src: path.join(FONT_DIR, 'DejaVuSansMono.ttf') },
		{ src: path.join(FONT_DIR, 'DejaVuSansMono-Bold.ttf'), fontWeight: 'bold' },
	],
});
Font.registerHyphenationCallback((word) => [word]);

const IMAGE_FORMATS = {
	'.jpg': 'jpg',
	'.jpeg': 'jpg',
	'.png': 'png',
} as const;

const HEADING_SIZES = [18, 14, 12, 11, 10, 10];

const styles = StyleSheet.create({
	page: {
		fontFamily: 'DejaVu',
		fontSize: 9.5,
		lineHeight: 1.55,
		color: TEXT,
		paddingTop: PAGE_MARGIN,
		paddingBottom: PAGE_MARGIN + 12,
		paddingHorizontal: PAGE_MARGIN,
	},
	title: { fontSize: 22, fontWeight: 'bold', lineHeight: 1.25 },
	meta: { fontSize: 8, color: MUTED, marginTop: 4 },
	description: { fontSize: 10.5, color: MUTED, marginTop: 6 },
	rule: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 14 },
	heading: {
		fontWeight: 'bold',
		lineHeight: 1.3,
		marginTop: 14,
		marginBottom: 6,
	},
	paragraph: { marginBottom: 7 },
	code: { fontFamily: 'DejaVuMono', fontSize: 8.5 },
	codeBlock: {
		fontFamily: 'DejaVuMono',
		fontSize: 8,
		lineHeight: 1.4,
		backgroundColor: '#f5f5f5',
		padding: 8,
		borderRadius: 3,
		marginBottom: 8,
	},
	link: { color: LINK, textDecoration: 'underline' },
	listItem: { flexDirection: 'row', marginBottom: 3 },
	listMarker: { width: 16 },
	listBody: { flex: 1 },
	table: {
		borderWidth: 1,
		borderColor: BORDER,
		borderRadius: 3,
		marginBottom: 10,
	},
	tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: BORDER },
	tableHeader: { flexDirection: 'row', backgroundColor: '#f2f2f2' },
	tableCell: {
		flex: 1,
		paddingVertical: 4,
		paddingHorizontal: 6,
		fontSize: 8.5,
	},
	quote: {
		borderLeftWidth: 2.5,
		borderLeftColor: '#bfbfbf',
		paddingLeft: 10,
		marginBottom: 8,
	},
	figure: { marginVertical: 8 },
	image: { borderWidth: 1, borderColor: BORDER, borderRadius: 3 },
	caption: { fontSize: 8, color: MUTED, marginTop: 4, textAlign: 'center' },
	footer: {
		position: 'absolute',
		bottom: PAGE_MARGIN / 2,
		left: PAGE_MARGIN,
		right: PAGE_MARGIN,
		flexDirection: 'row',
		justifyContent: 'space-between',
		fontSize: 7.5,
		color: MUTED,
	},
});

type Context = { origin: string; fromDir: string[] };

function inline(nodes: InlineNode[], ctx: Context): ReactNode[] {
	return nodes.map((node, index) =>
		inlineNode(node, `${node.type}-${index}`, ctx)
	);
}

function inlineNode(node: InlineNode, key: string, ctx: Context): ReactNode {
	switch (node.type) {
		case 'text':
			return node.value.replace(/\s*\n\s*/g, ' ');
		case 'inlineCode':
			return (
				<Text key={key} style={styles.code}>
					{node.value}
				</Text>
			);
		case 'strong':
			return (
				<Text key={key} style={{ fontWeight: 'bold' }}>
					{inline(node.children, ctx)}
				</Text>
			);
		case 'emphasis':
			return (
				<Text key={key} style={{ fontStyle: 'italic' }}>
					{inline(node.children, ctx)}
				</Text>
			);
		case 'strike':
			return (
				<Text key={key} style={{ textDecoration: 'line-through' }}>
					{inline(node.children, ctx)}
				</Text>
			);
		case 'break':
			return '\n';
		case 'footnoteReference':
			return `[${node.number}]`;
		case 'image':
			return node.alt;
		case 'inlineHtml':
			return null;
		case 'link': {
			const link = resolveDocLink(node.href, ctx.fromDir, getDocLinkIndex());
			if (link.kind === 'anchor') return inline(node.children, ctx);

			const href =
				link.kind === 'internal' ? `${ctx.origin}${link.href}` : link.href;
			return (
				<Link key={key} src={href} style={styles.link}>
					{inline(node.children, ctx)}
				</Link>
			);
		}
	}
}

function Figure({ src: original, alt }: { src: string; alt: string }) {
	// PDFs can't embed SVG; diagrams keep a PNG copy next to the SVG for exports.
	const src = original.replace(/\.svg$/i, '.png');
	const format =
		IMAGE_FORMATS[
			path.extname(src).toLowerCase() as keyof typeof IMAGE_FORMATS
		];
	const file = path.join(PUBLIC_DIR, src);

	if (!src.startsWith('/') || !format || !fs.existsSync(file)) {
		return (
			<Text style={[styles.paragraph, { fontStyle: 'italic' }]}>{alt}</Text>
		);
	}

	const data = fs.readFileSync(file);
	const { width = CONTENT_WIDTH, height = CONTENT_WIDTH } = imageSize(data);
	const scale = Math.min(1, CONTENT_WIDTH / width);

	return (
		<View style={styles.figure} wrap={false}>
			<Image
				src={{ data, format }}
				style={[styles.image, { width: width * scale, height: height * scale }]}
			/>
			{alt && <Text style={styles.caption}>{alt}</Text>}
		</View>
	);
}

function List({
	node,
	ctx,
}: {
	node: Extract<BlockNode, { type: 'list' }>;
	ctx: Context;
}) {
	const start = node.start ?? 1;

	return (
		<View style={{ marginBottom: 6 }}>
			{node.items.map((item, index) => (
				<View
					key={`item-${start + index}`}
					style={styles.listItem}
					wrap={false}
				>
					<Text style={styles.listMarker}>
						{node.ordered ? `${start + index}.` : '•'}
					</Text>
					<View style={styles.listBody}>
						{blocks(item.children, ctx, { compact: true })}
					</View>
				</View>
			))}
		</View>
	);
}

function Table({
	node,
	ctx,
}: {
	node: Extract<BlockNode, { type: 'table' }>;
	ctx: Context;
}) {
	return (
		<View style={styles.table}>
			<View style={styles.tableHeader} wrap={false}>
				{node.header.map((cell, index) => (
					<Text
						key={`head-${index}-${cell.children.length}`}
						style={[styles.tableCell, { fontWeight: 'bold' }]}
					>
						{inline(cell.children, ctx)}
					</Text>
				))}
			</View>
			{node.rows.map((row, rowIndex) => (
				<View key={`row-${rowIndex}`} style={styles.tableRow} wrap={false}>
					{row.map((cell, index) => (
						<Text key={`cell-${rowIndex}-${index}`} style={styles.tableCell}>
							{inline(cell.children, ctx)}
						</Text>
					))}
				</View>
			))}
		</View>
	);
}

function block(
	node: BlockNode,
	key: string,
	ctx: Context,
	{ compact = false } = {}
): ReactNode {
	switch (node.type) {
		case 'heading': {
			const size = HEADING_SIZES[node.depth - 1] ?? 10;
			return (
				<Text
					key={key}
					style={[styles.heading, { fontSize: size }]}
					minPresenceAhead={90}
				>
					{inline(node.children, ctx)}
				</Text>
			);
		}
		case 'paragraph': {
			const [only] = node.children;
			if (node.children.length === 1 && only?.type === 'image') {
				return <Figure key={key} src={only.src} alt={only.alt} />;
			}
			return (
				<Text
					key={key}
					style={compact ? { marginBottom: 2 } : styles.paragraph}
				>
					{inline(node.children, ctx)}
				</Text>
			);
		}
		case 'list':
			return <List key={key} node={node} ctx={ctx} />;
		case 'table':
			return <Table key={key} node={node} ctx={ctx} />;
		case 'blockquote':
			return (
				<View key={key} style={styles.quote}>
					{blocks(node.children, ctx)}
				</View>
			);
		case 'callout':
			return (
				<View key={key} style={styles.quote}>
					<Text style={{ fontWeight: 'bold', marginBottom: 3 }}>
						{node.title || node.kind}
					</Text>
					{blocks(node.children, ctx)}
				</View>
			);
		case 'code':
			return (
				<View key={key} style={styles.codeBlock} wrap={false}>
					<Text>{node.value}</Text>
				</View>
			);
		case 'thematicBreak':
			return <View key={key} style={styles.rule} />;
		case 'footnotes':
			return (
				<View key={key}>
					{node.items.map((item) => (
						<View key={item.id}>{blocks(item.children, ctx)}</View>
					))}
				</View>
			);
		case 'component':
			return <View key={key}>{blocks(node.children, ctx)}</View>;
		case 'html':
			return null;
	}
}

function blocks(
	nodes: BlockNode[],
	ctx: Context,
	options?: { compact?: boolean }
): ReactNode[] {
	return nodes.map((node, index) =>
		block(node, `${node.type}-${index}`, ctx, options)
	);
}

function DocPdf({ page, origin }: { page: DocPage; origin: string }) {
	const ctx: Context = {
		origin,
		fromDir: page.sourcePath.split('/').slice(0, -1),
	};
	const lastVerified = page.frontmatter.last_verified;

	return (
		<Document title={page.heading} subject={page.description}>
			<Page size='A4' style={styles.page}>
				<Text style={styles.title}>{page.heading}</Text>
				{lastVerified && (
					<Text style={styles.meta}>Last verified {lastVerified}</Text>
				)}
				{page.description && (
					<Text style={styles.description}>{page.description}</Text>
				)}
				<View style={styles.rule} />

				{blocks(page.document.children, ctx)}

				<View style={styles.footer} fixed>
					<Text>{page.heading}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`${pageNumber} / ${totalPages}`
						}
					/>
				</View>
			</Page>
		</Document>
	);
}

export function buildPdf(page: DocPage, origin: string): Promise<Buffer> {
	return renderToBuffer(<DocPdf page={page} origin={origin} />);
}
