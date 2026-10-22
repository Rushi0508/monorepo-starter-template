import { Button } from '@repo/ui/components/button';
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@repo/ui/components/empty';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
	return (
		<div className='flex min-h-dvh items-center justify-center p-4'>
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<FileQuestion />
					</EmptyMedia>
					<EmptyTitle>Page not found</EmptyTitle>
					<EmptyDescription>
						The page you&apos;re looking for doesn&apos;t exist or was moved.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button render={<Link href='/' />} nativeButton={false}>
						Go home
					</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
}
