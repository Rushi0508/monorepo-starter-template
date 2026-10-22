'use client';

import { Button } from '@repo/ui/components/button';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import NavSearchPalette from './NavSearchPalette';

const NavSearch = () => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<>
			<Button
				variant='subtle'
				className='text-muted-foreground w-52 justify-between gap-2 text-sm font-normal'
				onClick={() => setOpen(true)}
			>
				<span className='flex items-center gap-2'>
					<Search className='size-3.5' />
					Search...
				</span>
				<kbd className='bg-muted pointer-events-none hidden h-6 select-none items-center gap-1 rounded border px-1 font-mono font-medium sm:flex'>
					<span className='text-lg'>⌘</span>
					<span className='text-xs'>K</span>
				</kbd>
			</Button>
			<NavSearchPalette open={open} onOpenChange={setOpen} />
		</>
	);
};

export default NavSearch;
