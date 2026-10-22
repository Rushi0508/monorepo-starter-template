import { Card, CardContent } from '@repo/ui/components/card';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
	/** What this page will do once designed — keeps the stub informative */
	upcoming: string;
}

/**
 * Stand-in for pages still to be designed, so the section
 * navigates end to end while pages land one at a time. Replace with the real
 * component when the page is built.
 */
export function ComingSoon({ upcoming }: ComingSoonProps) {
	return (
		<Card className='w-full shadow-xs'>
			<CardContent>
				<div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<Construction className='size-10 text-muted-foreground' />
					<p className='text-xl font-semibold'>Coming soon</p>
					<p className='max-w-md text-base text-muted-foreground'>{upcoming}</p>
				</div>
			</CardContent>
		</Card>
	);
}
