import { ExternalLink } from 'lucide-react';

export function SkuNamingCard() {
	return (
		<div className='space-y-1 rounded-md border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground'>
			<p className='font-medium uppercase tracking-wide'>How to name it</p>
			<p>
				<code className='font-mono text-foreground'>
					SAU-FLAVOR-SIZE-PACK[-VARIANT]
				</code>
			</p>
			<p>
				<code className='font-mono text-foreground'>SAU</code> drinks ·{' '}
				<code className='font-mono text-foreground'>BDL</code> bundles ·{' '}
				<code className='font-mono text-foreground'>PKG</code> packaging ·{' '}
				<code className='font-mono text-foreground'>ING</code> ingredients
			</p>
			<p>Title: same order, without "Sauero"</p>
			<a
				href='/docs/guides/how-to-name-a-sku'
				target='_blank'
				rel='noopener'
				className='inline-flex items-center gap-1 pt-1 font-medium text-foreground underline underline-offset-2'
			>
				How to name a SKU
				<ExternalLink className='size-3' />
			</a>
		</div>
	);
}
