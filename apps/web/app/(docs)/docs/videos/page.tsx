import { SidebarInset } from '@repo/ui/components/sidebar';
import type { Metadata } from 'next';
import { DocsTopBar } from '@/components/docs/DocsTopBar';
import { TrainingVideos } from '@/components/docs/TrainingVideos';

export const metadata: Metadata = { title: 'Training videos · Help Center' };

const TrainingVideosPage = () => {
	return (
		<SidebarInset className='h-dvh overflow-hidden'>
			<DocsTopBar title='Training videos' />
			<div className='flex-1 overflow-y-auto overscroll-contain'>
				<div className='mx-auto w-full max-w-7xl px-6 pt-6 pb-8 lg:px-8'>
					<TrainingVideos />
				</div>
			</div>
		</SidebarInset>
	);
};

export default TrainingVideosPage;
