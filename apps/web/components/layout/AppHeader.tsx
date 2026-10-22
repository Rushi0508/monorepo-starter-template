import Link from 'next/link';
import { ProfileDropdown } from './ProfileDropdown';

export function AppHeader() {
	return (
		<header className='bg-background/80 sticky top-0 z-10 border-b backdrop-blur'>
			<div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4'>
				<Link href='/' className='font-semibold'>
					Starter
				</Link>
				<ProfileDropdown />
			</div>
		</header>
	);
}
