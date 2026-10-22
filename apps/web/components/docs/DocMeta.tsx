import type { DocFrontmatter } from '@repo/docs';

/**
 * Provenance line for a doc page. `last_verified` is the date someone last
 * checked the page against the running system — it sits in the corner of the
 * page header, where a reader sees how current the page is before reading it
 * rather than after.
 */
export function DocMeta({ frontmatter }: { frontmatter: DocFrontmatter }) {
	const { last_verified: lastVerified } = frontmatter;

	if (!lastVerified) return null;

	return (
		<p
			className='shrink-0 pt-1 text-xs text-muted-foreground'
			title={`Last verified against the system on ${lastVerified}`}
		>
			Last verified <time dateTime={lastVerified}>{lastVerified}</time>
		</p>
	);
}

export default DocMeta;
