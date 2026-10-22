'use client';

import type { TrainingVideoType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { toVideoEmbedUrl } from '@repo/utils';
import { format } from 'date-fns';
import { EllipsisVertical, Pencil, Play, Trash2 } from 'lucide-react';
import { ClampedText } from './ClampedText';
import { VideoEmbed } from './VideoEmbed';

type TrainingVideoCardProps = Readonly<{
	video: TrainingVideoType;
	onPlay: (video: TrainingVideoType) => void;
	onEdit: (video: TrainingVideoType) => void;
	onDelete: (video: TrainingVideoType) => void;
}>;

export function TrainingVideoCard({
	video,
	onPlay,
	onEdit,
	onDelete,
}: TrainingVideoCardProps) {
	const embedUrl = toVideoEmbedUrl(video.url);

	return (
		<article
			onClick={() => onPlay(video)}
			className='group flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40'
		>
			{/* The iframe only supplies the poster frame here; playback happens in
			    the overlay, so the button on top takes every click. */}
			<div className='relative'>
				{embedUrl && (
					<div className='pointer-events-none' aria-hidden>
						<VideoEmbed src={embedUrl} title={video.title} />
					</div>
				)}
				<button
					type='button'
					onClick={(event) => {
						event.stopPropagation();
						onPlay(video);
					}}
					aria-label={`Play ${video.title}`}
					className='absolute inset-0 flex items-center justify-center rounded-md bg-black/10 transition-colors group-hover:bg-black/25'
				>
					<span className='flex size-12 items-center justify-center rounded-full bg-background/90 shadow-md transition-transform group-hover:scale-105'>
						<Play className='ml-0.5 size-5 fill-current' />
					</span>
				</button>
			</div>

			<div className='flex items-start justify-between gap-2 px-1'>
				<div className='min-w-0'>
					<h3 className='font-medium leading-snug'>{video.title}</h3>
					<p className='mt-0.5 text-xs text-muted-foreground'>
						{[
							video.createdBy?.name,
							format(new Date(video.createdAt), 'MMM d, yyyy'),
						]
							.filter(Boolean)
							.join(' · ')}
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
							className='size-8 shrink-0'
							aria-label={`Actions for ${video.title}`}
							onClick={(event) => event.stopPropagation()}
						>
							<EllipsisVertical className='size-4' />
						</Button>
					</DropdownMenuTrigger>
					{/* Portalled, but React still bubbles its clicks to the card. */}
					<DropdownMenuContent
						align='end'
						onClick={(event) => event.stopPropagation()}
					>
						<DropdownMenuItem onSelect={() => onEdit(video)}>
							<Pencil />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							variant='destructive'
							onSelect={() => onDelete(video)}
						>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{video.description && (
				<ClampedText text={video.description} className='px-1 pb-1' />
			)}
		</article>
	);
}
