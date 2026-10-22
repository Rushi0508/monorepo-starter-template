import type { LucideIcon } from 'lucide-react';
import {
	Activity,
	Home,
	LifeBuoy,
	LineChart,
	Link2,
	Mail,
	Package,
	Plug,
	Settings,
	Settings2,
	ShoppingCart,
	TrendingUp,
	Truck,
	UserCog,
	Users,
} from 'lucide-react';

/** Non-navigating entries: rendered as a button that opens a dialog. */
export type RouteAction = 'connect-mcp';

export type RouteBadge = 'folk-pending-review';

export type RouteItem = {
	name: string;
	/** Omitted for action items, which open a dialog instead of navigating. */
	href?: string;
	icon: LucideIcon;
	items?: { name: string; href: string }[];
	action?: RouteAction;
	badge?: RouteBadge;
};

export const APP_ROUTES: Record<string, RouteItem[]> = {
	Operations: [
		{
			name: 'Home',
			href: '/',
			icon: Home,
		},
		{
			name: 'Orders',
			href: '/orders',
			icon: ShoppingCart,
		},
		{
			name: 'Fulfillment',
			href: '/fulfillment',
			icon: Truck,
		},
		{
			name: 'Inventory',
			href: '/inventory',
			icon: Package,
			items: [
				{
					name: 'Bluebox',
					href: '/inventory/bluebox',
				},
				{
					name: 'Manuel Brothers',
					href: '/inventory/manuel-brothers',
				},
			],
		},
	],

	Planning: [
		{
			name: 'Demand Planning',
			href: '/demand-planning',
			icon: LineChart,
			items: [
				{
					name: 'Plan Workspace',
					href: '/demand-planning/workspace',
				},
				{
					name: 'Scenario Plans',
					href: '/demand-planning/scenarios',
				},
				{
					name: 'Plan History',
					href: '/demand-planning/history',
				},
				{
					name: 'Compare Plans',
					href: '/demand-planning/compare',
				},
				{
					name: 'Forecast Accuracy',
					href: '/demand-planning/accuracy',
				},
			],
		},
	],

	Commercial: [
		{
			name: 'Revenue',
			href: '/revenue',
			icon: TrendingUp,
		},
		{
			name: 'Customers',
			href: '/customers',
			icon: Users,
		},
	],

	System: [
		{
			name: 'Inbound Emails',
			href: '/inbound-emails',
			icon: Mail,
		},
		{
			name: 'Folk mapping',
			href: '/folk',
			icon: Link2,
			badge: 'folk-pending-review',
		},
		{
			name: 'Connect to MCP',
			icon: Plug,
			action: 'connect-mcp',
		},
		{
			name: 'Data Pipeline Health',
			href: '/pipeline',
			icon: Activity,
		},
		{
			name: 'SKU Settings',
			href: '/sku-settings',
			icon: Settings,
		},
		{
			name: 'Configuration',
			href: '/configuration',
			icon: Settings2,
		},
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
