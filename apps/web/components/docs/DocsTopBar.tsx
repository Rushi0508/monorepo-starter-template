import { Separator } from '@repo/ui/components/separator';
import { SidebarTrigger } from '@repo/ui/components/sidebar';
import NavSearch from '@/components/layout/NavSearch';
import ProfileDropdown from '@/components/layout/ProfileDropdown';
import ThemeToggle from '@/components/layout/ThemeToggle';

export function DocsTopBar({ title }: { title: string }) {
	return (
		<header className='flex h-13 shrink-0 items-center gap-2 border-b bg-background px-4'>
			<SidebarTrigger className='-ml-1' />
			<Separator orientation='vertical' className='mr-2 h-4' />
			<span className='truncate text-sm font-medium'>{title}</span>
			{/* Same controls, spacing and order as the app shell's header. */}
			<div className='ml-auto flex items-center gap-4'>
				<NavSearch />
				<ThemeToggle />
				<ProfileDropdown />
			</div>
		</header>
	);
}
