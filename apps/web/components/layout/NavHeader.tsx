'use client';
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@repo/ui/components/sidebar';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Branding block at the top of a sidebar. The docs sidebar reuses it with its
 * own subtitle and home link so both shells carry the same logo and type.
 */
export function NavHeader({
	subtitle = 'Unified business view',
	href = '/',
}: {
	subtitle?: string;
	href?: string;
}) {
	const appName = 'Sauerobase';

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size='lg' asChild>
					<Link href={href}>
						<div className='relative flex aspect-square size-8 items-center justify-center group-data-[collapsible=icon]:size-8'>
							<Image
								src='/images/logo.png'
								alt='Logo'
								fill
								className='object-contain'
							/>
						</div>
						<div className='grid flex-1 text-left text-sm leading-tight'>
							<span className='truncate font-semibold'>{appName}</span>
							<span className='truncate text-xs'>{subtitle}</span>
						</div>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
