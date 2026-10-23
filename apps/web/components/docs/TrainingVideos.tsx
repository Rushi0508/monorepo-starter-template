'use client';

import type { TrainingVideoType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { PlusCircle, Video } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import AlertMessage from '@/components/general/AlertMessage';
import { CustomAlertDialog } from '@/components/general/CustomAlertDialog';
import { DataLoader } from '@/components/general/DataLoader';
import EmptyMessage from '@/components/general/EmptyMessage';
import { useDeleteTrainingVideo, useTrainingVideos } from '@/queries';
import { CreateUpdateTrainingVideoDialog } from './CreateUpdateTrainingVideoDialog';
import { TrainingVideoCard } from './TrainingVideoCard';
import { TrainingVideoPlayerDialog } from './TrainingVideoPlayerDialog';

export function TrainingVideos() {
	const { data: videos, isLoading, error } = useTrainingVideos();
	const { mutate: deleteVideo, isPending: isDeleting } =
		useDeleteTrainingVideo();

	const [formOpen, setFormOpen] = useState(false);
	const [editingVideo, setEditingVideo] = useState<TrainingVideoType | null>(
		null
	);
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// The open video lives in the URL, so search results and shared links can
	// land straight on a playing video.
	const playingId = searchParams.get('video');
	const playingVideo = videos?.find((video) => video.id === playingId) ?? null;
	const setPlayingVideo = (video: TrainingVideoType | null) => {
		router.replace(video ? `${pathname}?video=${video.id}` : pathname, {
			scroll: false,
		});
	};
	const [videoToDelete, setVideoToDelete] = useState<TrainingVideoType | null>(
		null
	);

	const handleAdd = () => {
		setEditingVideo(null);
		setFormOpen(true);
	};

	const handleEdit = (video: TrainingVideoType) => {
		setEditingVideo(video);
		setFormOpen(true);
	};

	const handleFormClose = () => {
		setFormOpen(false);
		setEditingVideo(null);
	};

	const handleDeleteConfirm = () => {
		if (!videoToDelete) return;
		deleteVideo(videoToDelete.id, {
			onSuccess: () => setVideoToDelete(null),
		});
	};

	return (
		<div className='space-y-6'>
			<header className='flex flex-wrap items-start justify-between gap-4 border-b pb-4'>
				<div className='min-w-0'>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Training videos
					</h1>
					<p className='mt-1 text-base leading-7 text-muted-foreground'>
						Short walkthroughs of how to use the app. Anyone on the team can add
						one.
					</p>
				</div>
				<Button onClick={handleAdd}>
					<PlusCircle className='size-4' />
					Add Video
				</Button>
			</header>

			{isLoading && <DataLoader />}

			{error && <AlertMessage message={error.message} variant='destructive' />}

			{videos &&
				(videos.length ? (
					<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
						{videos.map((video) => (
							<TrainingVideoCard
								key={video.id}
								video={video}
								onPlay={setPlayingVideo}
								onEdit={handleEdit}
								onDelete={setVideoToDelete}
							/>
						))}
					</div>
				) : (
					<EmptyMessage
						message='No training videos yet'
						description='Add a Loom or Tella link to share a walkthrough with the team.'
						icon={<Video className='size-8 text-muted-foreground' />}
						cta={
							<Button variant='outline' onClick={handleAdd}>
								<PlusCircle className='size-4' />
								Add Video
							</Button>
						}
					/>
				))}

			<TrainingVideoPlayerDialog
				video={playingVideo}
				onClose={() => setPlayingVideo(null)}
			/>

			<CreateUpdateTrainingVideoDialog
				open={formOpen}
				onClose={handleFormClose}
				video={editingVideo}
			/>

			<CustomAlertDialog
				isOpen={!!videoToDelete}
				onClose={() => setVideoToDelete(null)}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
				title='Delete training video?'
				description={
					videoToDelete
						? `This removes "${videoToDelete.title}" from the Help Center. The video itself stays on Loom or Tella.`
						: undefined
				}
				cancelText='Cancel'
				confirmText='Delete'
			/>
		</div>
	);
}
