'use client';

import { PageHeader } from '@/components/general/PageHeader';
import AsnSection from './asn/AsnSection';
import KitOrderSection from './kit-order/KitOrderSection';
import ProductionRunSection from './production-run/ProductionRunSection';
import SkuSection from './sku/SkuSection';

const BlueboxInventoryComponent = () => {
	return (
		<div className='space-y-6'>
			<PageHeader
				title='Bluebox Inventory'
				description='SKU positions across Shopify and Bluebox, with production runs, inbound ASNs and kitting orders.'
			/>

			<div className='space-y-8'>
				<SkuSection />
				<ProductionRunSection />
				<AsnSection />
				<KitOrderSection />
			</div>
		</div>
	);
};

export default BlueboxInventoryComponent;
