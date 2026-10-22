import { ExternalLink } from 'lucide-react';

/**
 * A screenshot or diagram in a doc. Doc images are usually wider than the
 * column they sit in, so the inline copy is a preview and clicking opens the
 * full-size image in a new tab. The alt text doubles as the caption.
 */
export function GuideImage({ src, alt }: { src: string; alt?: string }) {
	return (
		<figure className='guide-figure'>
			<a
				href={src}
				target='_blank'
				rel='noopener'
				className='guide-figure-zoom'
				aria-label={
					alt
						? `Open full size in a new tab: ${alt}`
						: 'Open full size in a new tab'
				}
			>
				{/* biome-ignore lint/performance/noImgElement: doc images are authored as plain markdown, so their dimensions are unknown */}
				<img src={src} alt={alt ?? ''} />
				<span className='guide-figure-hint' aria-hidden='true'>
					<ExternalLink className='size-3.5' />
					Open full size
				</span>
			</a>
			{alt && <figcaption>{alt}</figcaption>}
		</figure>
	);
}

export default GuideImage;
