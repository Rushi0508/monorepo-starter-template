'use client';

import { PageHeader } from '@/components/general/PageHeader';
import { ReplenishmentSection } from './replenishment/ReplenishmentSection';
import SkuSection from './sku/SkuSection';

const ManuelBrothersInventoryComponent = () => {
	return (
		<div className='space-y-6'>
			<PageHeader
				title='Manuel Brothers Inventory'
				description='Inventory levels for Manuel Brothers (Distributor). Reconciled from Shopify.'
			/>

			<div className='space-y-8'>
				<SkuSection />
				<ReplenishmentSection />
			</div>
		</div>
	);
};

export default ManuelBrothersInventoryComponent;
