import type { NextRequest } from 'next/server';
import { buildDocx } from '@/lib/docs/export/docx';
import { buildMarkdown } from '@/lib/docs/export/markdown';
import { buildPdf } from '@/lib/docs/export/pdf';
import { getDocPage } from '@/lib/docs/source';

/**
 * Built per request rather than at build time: exports carry absolute links
 * back into the app, and the public origin is only known from the request.
 */
export const dynamic = 'force-dynamic';

const FORMATS = {
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	md: 'text/markdown; charset=utf-8',
	pdf: 'application/pdf',
} as const;

type Format = keyof typeof FORMATS;

const isFormat = (value: string): value is Format => value in FORMATS;

function originOf(request: NextRequest) {
	const host =
		request.headers.get('x-forwarded-host') ?? request.headers.get('host');
	const proto =
		request.headers.get('x-forwarded-proto') ??
		request.nextUrl.protocol.replace(':', '');

	return host ? `${proto}://${host}` : request.nextUrl.origin;
}

export async function GET(
	request: NextRequest,
	{ params }: RouteContext<'/docs/export/[format]/[...slug]'>
) {
	const { format, slug } = await params;
	const page = getDocPage(slug);

	if (!page || !isFormat(format)) {
		return new Response('Not found', { status: 404 });
	}

	const origin = originOf(request);
	const body =
		format === 'md'
			? buildMarkdown(page, origin)
			: new Uint8Array(
					await (format === 'docx' ? buildDocx : buildPdf)(page, origin)
				);

	return new Response(body, {
		headers: {
			'Content-Type': FORMATS[format],
			'Content-Disposition': `attachment; filename="${slug.at(-1)}.${format}"`,
			'Cache-Control': 'no-store',
		},
	});
}
