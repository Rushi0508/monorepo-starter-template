import { useQuery } from '@tanstack/react-query';
import { DOC_SEARCH_INDEX_URL, type DocSearchEntry } from '@/lib/docs/search';

/** Docs change only on deploy, so one fetch per session is enough. */
export function useDocSearchIndex(enabled: boolean) {
	return useQuery({
		queryKey: ['docs-search-index'],
		queryFn: async () => {
			const res = await fetch(DOC_SEARCH_INDEX_URL);
			if (!res.ok) throw new Error('Could not load the docs search index');
			return (await res.json()) as DocSearchEntry[];
		},
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
