import { ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export function TrainingVideosLink() {
	return (
		<section className='mb-8'>
			<h2 className='mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
				Training
			</h2>
			<Link
				href='/docs/videos'
				className='flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent'
			>
				<PlayCircle className='size-5 text-muted-foreground' />
				<span className='flex-1'>
					<span className='block font-medium'>Training videos</span>
					<span className='block text-muted-foreground'>
						Step-by-step walkthroughs of how to use the app
					</span>
				</span>
				<ChevronRight className='size-4 text-muted-foreground' />
			</Link>
		</section>
	);
}
