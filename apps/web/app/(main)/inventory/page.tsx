'use client';

import { Package, Warehouse } from 'lucide-react';
import { InventorySummarySection } from '@/components/inventory/InventoryBreakdownTable';
import { RootLayoutForNestedRoute } from '@/components/layout/RootLayoutForNestedRoute';

const InventoryPage = () => {
	return (
		<RootLayoutForNestedRoute
			title='Inventory'
			description='View and manage inventory across all warehouse partners.'
			sections={[
				{
					title: 'Bluebox',
					description:
						'Primary 3PL warehouse - live SKU positions, lot details, and expiry tracking.',
					href: '/bluebox',
					icon: Package,
				},
				{
					title: 'Manuel Brothers',
					description:
						'Distributor inventory - inventory tracked using replenishment orders to bluebox',
					href: '/manuel-brothers',
					icon: Warehouse,
				},
			]}
		>
			<InventorySummarySection />
		</RootLayoutForNestedRoute>
	);
};

export default InventoryPage;
