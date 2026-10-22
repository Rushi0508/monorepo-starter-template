import { getDocSearchIndex } from '@/lib/docs/search-index';

/** Built once at build time; the command palette fetches it on first open. */
export const dynamic = 'force-static';

export function GET() {
	return Response.json(getDocSearchIndex());
}
