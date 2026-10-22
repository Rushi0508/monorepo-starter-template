'use client';

import type { TrainingVideoType } from '@repo/types';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { toVideoEmbedUrl } from '@repo/utils';
import { ClampedText } from './ClampedText';
import { VideoEmbed } from './VideoEmbed';

type TrainingVideoPlayerDialogProps = Readonly<{
	video: TrainingVideoType | null;
	onClose: () => void;
}>;

export function TrainingVideoPlayerDialog({
	video,
	onClose,
}: TrainingVideoPlayerDialogProps) {
	const embedUrl = video ? toVideoEmbedUrl(video.url) : null;

	return (
		<Dialog open={!!video} onOpenChange={onClose}>
			<DialogContent className='max-w-5xl'>
				<DialogHeader className='pr-6'>
					<DialogTitle>{video?.title}</DialogTitle>
					{video?.description && (
						<DialogDescription asChild>
							<div>
								<ClampedText text={video.description} />
							</div>
						</DialogDescription>
					)}
				</DialogHeader>
				{video && embedUrl && <VideoEmbed src={embedUrl} title={video.title} />}
			</DialogContent>
		</Dialog>
	);
}
