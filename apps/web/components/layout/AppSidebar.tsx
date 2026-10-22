'use client';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@repo/ui/components/collapsible';
import { Separator } from '@repo/ui/components/separator';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from '@repo/ui/components/sidebar';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useMemo, useRef } from 'react';
import { APP_ROUTES, type RouteAction } from '@/config/routes';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { NavHeader } from './NavHeader';
import NavSearch from './NavSearch';
import ProfileDropdown from './ProfileDropdown';

const formatSegmentName = (segment: string): string => {
	return segment
		.replace(/[-_+=%@#$&*()[\]{}|\\:";'<>?,./]/g, ' ')
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

const ALL_ROUTE_ITEMS = Object.values(APP_ROUTES)
	.flat()
	.flatMap((item) => [item, ...(item.items ?? [])])
	.filter((item): item is { name: string; href: string } => Boolean(item.href));

const generateBreadcrumbs = (
	pathname: string,
	breadcrumbSegments: { segment: string; name: string }[]
) => {
	const pathSegments = pathname.split('/').filter(Boolean);
	const breadcrumbs = [];

	if (pathSegments.length === 0) {
		breadcrumbs.push({
			href: '/',
			name: 'Home',
			isLast: true,
			isClickable: false,
		});
		return breadcrumbs;
	}

	for (let i = 0; i < pathSegments.length; i++) {
		const segment = pathSegments[i] as string;
		const isLast = i === pathSegments.length - 1;
		const segmentHref = `/${pathSegments.slice(0, i + 1).join('/')}`;

		const registeredSegment = breadcrumbSegments.find(
			(bs) => bs.segment === segment
		);
		if (registeredSegment) {
			breadcrumbs.push({
				href: segmentHref,
				name: registeredSegment.name,
				isLast,
				isClickable: !isLast,
			});
			continue;
		}

		const matchingRoute = ALL_ROUTE_ITEMS.find(
			(item) => item.href === segmentHref
		);
		const segmentName = matchingRoute
			? matchingRoute.name
			: formatSegmentName(segment);

		breadcrumbs.push({
			href: segmentHref,
			name: segmentName,
			isLast,
			isClickable: !isLast,
		});
	}

	return breadcrumbs;
};

export function AppSidebar({
	children,
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const contentRef = useRef<HTMLDivElement>(null);
	const { setOpenMobile, isMobile, open } = useSidebar();
	const { segments: breadcrumbSegments } = useBreadcrumb();
	const routeActionHandlers: Record<RouteAction, () => void> = {};

	const breadcrumbs = useMemo(
		() => generateBreadcrumbs(pathname, breadcrumbSegments),
		[pathname, breadcrumbSegments]
	);

	const handleLinkClick = () => {
		if (isMobile) {
			setOpenMobile(false);
		}
	};

	return (
		<>
			<Sidebar collapsible='icon' {...props}>
				<SidebarHeader>
					<NavHeader />
				</SidebarHeader>
				<SidebarContent>
					{Object.entries(APP_ROUTES).map(([section, items]) => (
						<SidebarGroup key={section}>
							{open && (
								<div className='mb-3 px-2 text-sm font-medium text-muted-foreground'>
									{section}
								</div>
							)}

							<SidebarGroupContent>
								<SidebarMenu className='gap-1'>
									{items.map((item) => {
										if (item.action) {
											const runAction = routeActionHandlers[item.action];
											return (
												<SidebarMenuItem key={item.name}>
													<SidebarMenuButton
														tooltip={item.name}
														onClick={() => {
															runAction?.();
															handleLinkClick();
														}}
													>
														{item.icon && <item.icon />}
														<span>{item.name}</span>
														<ArrowUpRight className='ml-auto opacity-60' />
													</SidebarMenuButton>
												</SidebarMenuItem>
											);
										}

										const href = item.href ?? '/';
										const isActive =
											pathname === href ||
											(pathname.startsWith(href) && href !== '/');

										if (item.items?.length) {
											return (
												<SidebarMenuItem key={item.name}>
													<Collapsible
														defaultOpen={pathname.startsWith(href)}
														className='group/collapsible'
													>
														<CollapsibleTrigger asChild className='w-full'>
															<SidebarMenuButton
																tooltip={item.name}
																isActive={isActive}
																asChild
															>
																<Link href={href} onClick={handleLinkClick}>
																	{item.icon && <item.icon />}
																	<span>{item.name}</span>
																	<ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
																</Link>
															</SidebarMenuButton>
														</CollapsibleTrigger>
														<CollapsibleContent>
															<SidebarMenuSub>
																{item.items.map((subItem) => (
																	<SidebarMenuSubItem key={subItem.name}>
																		<SidebarMenuSubButton
																			asChild
																			isActive={pathname === subItem.href}
																		>
																			<Link
																				href={subItem.href}
																				onClick={handleLinkClick}
																			>
																				<span>{subItem.name}</span>
																			</Link>
																		</SidebarMenuSubButton>
																	</SidebarMenuSubItem>
																))}
															</SidebarMenuSub>
														</CollapsibleContent>
													</Collapsible>
												</SidebarMenuItem>
											);
										}

										return (
											<SidebarMenuItem key={item.name}>
												<SidebarMenuButton
													tooltip={item.name}
													isActive={isActive}
													asChild
												>
													<Link href={href} onClick={handleLinkClick}>
														{item.icon && <item.icon />}
														<span>{item.name}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										);
									})}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
			<SidebarInset className='h-dvh overflow-hidden'>
				<header className='flex h-13 shrink-0 items-center gap-2 border-b px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb className='hidden sm:flex'>
						<BreadcrumbList>
							{breadcrumbs.map((crumb) => (
								<React.Fragment key={crumb.href}>
									<BreadcrumbItem>
										{crumb.isLast ? (
											<BreadcrumbPage>{crumb.name}</BreadcrumbPage>
										) : crumb.isClickable ? (
											<BreadcrumbLink asChild>
												<Link href={crumb.href} onClick={handleLinkClick}>
													{crumb.name}
												</Link>
											</BreadcrumbLink>
										) : (
											<span className='text-muted-foreground'>
												{crumb.name}
											</span>
										)}
									</BreadcrumbItem>
									{!crumb.isLast && <BreadcrumbSeparator />}
								</React.Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
					<div className='flex items-center sm:hidden'>
						<span className='text-muted-foreground max-w-50 truncate text-sm font-medium'>
							{breadcrumbs[breadcrumbs.length - 1]?.name ?? 'Dashboard'}
						</span>
					</div>
					<div className='ml-auto flex items-center gap-4'>
						<NavSearch />
						<ProfileDropdown />
					</div>
				</header>
				<div className='w-full overflow-auto' ref={contentRef}>
					{children}
				</div>
			</SidebarInset>
		</>
	);
}
