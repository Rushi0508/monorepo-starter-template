'use client';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@repo/ui/components/collapsible';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarRail,
} from '@repo/ui/components/sidebar';
import { ArrowLeft, ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NavHeader } from '@/components/layout/NavHeader';
import type { DocNavItem } from '@/lib/docs/source';

/**
 * In-page navigation for /docs — the doc tree, not the app sidebar.
 *
 * Apart from the training videos page, every entry comes from a file on disk. A folder
 * renders as a label rather than a link, since it groups pages but is not one.
 */
function GuideNavNode({
	item,
	pathname,
}: {
	item: DocNavItem;
	pathname: string;
}) {
	const isActive = item.href === pathname;
	const [open, setOpen] = useState(true);

	if (!item.children.length) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					isActive={isActive}
					className='data-[active=true]:font-medium'
				>
					<Link href={item.href}>{item.title}</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className='group/collapsible'
			>
				<CollapsibleTrigger asChild className='w-full'>
					<SidebarMenuButton className='font-medium'>
						{item.title}
						<ChevronRight className='ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub className='gap-0.5'>
						{item.children.map((child) => (
							<GuideNavNode key={child.href} item={child} pathname={pathname} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

export function GuideSidebar({ nav }: { nav: DocNavItem[] }) {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader>
				<NavHeader subtitle='Help Center' href='/docs' />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu className='gap-0.5'>
						<SidebarMenuItem>
							<SidebarMenuButton asChild isActive={pathname === '/docs'}>
								<Link href='/docs'>All documentation</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild isActive={pathname === '/docs/videos'}>
								<Link href='/docs/videos'>
									<PlayCircle className='size-4' />
									Training videos
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						{nav.map((item) => (
							<GuideNavNode key={item.href} item={item} pathname={pathname} />
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarGroup className='mt-auto'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href='/'>
								<ArrowLeft className='size-4' />
								Back to app
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>

			<SidebarRail />
		</Sidebar>
	);
}

export default GuideSidebar;
