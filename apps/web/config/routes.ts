import type { LucideIcon } from 'lucide-react';
import { Home, LifeBuoy, UserCog } from 'lucide-react';

/**
 * Non-navigating entries: rendered as a button that runs an action (for
 * example, opening a dialog). Register the handler in AppSidebar's
 * `routeActionHandlers` under the same name.
 */
export type RouteAction = string;

export type RouteItem = {
	name: string;
	/** Omitted for action items, which run an action instead of navigating. */
	href?: string;
	icon: LucideIcon;
	items?: { name: string; href: string }[];
	action?: RouteAction;
};

export const APP_ROUTES: Record<string, RouteItem[]> = {
	Operations: [
		{
			name: 'Home',
			href: '/',
			icon: Home,
		},
	],

	System: [
		{
			name: 'Users',
			href: '/users',
			icon: UserCog,
		},
		{
			name: 'Help Center',
			href: '/docs',
			icon: LifeBuoy,
		},
	],
};
