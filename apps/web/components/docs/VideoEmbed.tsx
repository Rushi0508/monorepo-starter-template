type VideoEmbedProps = Readonly<{
	src: string;
	title: string;
}>;

export function VideoEmbed({ src, title }: VideoEmbedProps) {
	return (
		<div className='aspect-video w-full overflow-hidden rounded-md border bg-muted'>
			<iframe
				src={src}
				title={title}
				loading='lazy'
				allow='autoplay; fullscreen; picture-in-picture; clipboard-write'
				allowFullScreen
				className='size-full border-0'
			/>
		</div>
	);
}
