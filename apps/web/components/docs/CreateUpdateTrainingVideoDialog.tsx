'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTrainingVideoSchema } from '@repo/schemas';
import type { CreateTrainingVideoInput, TrainingVideoType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { toVideoEmbedUrl } from '@repo/utils';
import { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import LoadingButton from '@/components/general/LoadingButton';
import RequiredStar from '@/components/general/RequiredStar';
import { useCreateTrainingVideo, useUpdateTrainingVideo } from '@/queries';
import { VideoEmbed } from './VideoEmbed';

const TrainingVideoFormSchema = CreateTrainingVideoSchema.refine(
	(data) => toVideoEmbedUrl(data.url) !== null,
	{ path: ['url'], message: 'Paste a Loom or Tella share link' }
);

type CreateUpdateTrainingVideoDialogProps = Readonly<{
	open: boolean;
	onClose: () => void;
	video?: TrainingVideoType | null;
}>;

export function CreateUpdateTrainingVideoDialog({
	open,
	onClose,
	video,
}: CreateUpdateTrainingVideoDialogProps) {
	const { mutate: createVideo, isPending: isCreating } =
		useCreateTrainingVideo();
	const { mutate: updateVideo, isPending: isUpdating } =
		useUpdateTrainingVideo();
	const isPending = isCreating || isUpdating;

	const getDefaultValues = useCallback(
		(video?: TrainingVideoType | null): CreateTrainingVideoInput => {
			return {
				title: video?.title ?? '',
				description: video?.description ?? '',
				url: video?.url ?? '',
			};
		},
		[]
	);

	const form = useForm<CreateTrainingVideoInput>({
		resolver: zodResolver(TrainingVideoFormSchema),
		defaultValues: getDefaultValues(),
	});

	useEffect(() => {
		if (open) {
			form.reset(getDefaultValues(video));
		}
	}, [open, video, getDefaultValues, form]);

	const url = useWatch({ control: form.control, name: 'url' });
	const previewUrl = url ? toVideoEmbedUrl(url) : null;

	const onSubmit = useCallback(
		(data: CreateTrainingVideoInput) => {
			if (video) {
				updateVideo({ id: video.id, data }, { onSuccess: () => onClose() });
			} else {
				createVideo(data, { onSuccess: () => onClose() });
			}
		},
		[video, updateVideo, createVideo, onClose]
	);

	const isEdit = !!video;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? 'Edit Training Video' : 'Add Training Video'}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Update the video link, title or description.'
							: 'Share a Loom or Tella recording. It plays right here in the Help Center.'}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='url'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Video link
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											placeholder='https://www.loom.com/share/…'
											inputMode='url'
											{...field}
										/>
									</FormControl>
									<FormDescription>Loom or Tella share link.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{previewUrl && (
							<VideoEmbed src={previewUrl} title='Video preview' />
						)}

						<FormField
							control={form.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Title
										<RequiredStar />
									</FormLabel>
									<FormControl>
										<Input
											placeholder='e.g. Adding a production run'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder='What does this video cover?'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className='pt-2'>
							<Button type='button' variant='outline' onClick={onClose}>
								Cancel
							</Button>
							<LoadingButton type='submit' isLoading={isPending}>
								{isEdit ? 'Save Changes' : 'Add Video'}
							</LoadingButton>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
