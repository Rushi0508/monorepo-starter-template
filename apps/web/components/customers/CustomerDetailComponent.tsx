'use client';

import { useParams } from 'next/navigation';
import AlertMessage from '@/components/general/AlertMessage';
import { useCustomerDetail } from '@/queries';
import ContactCard from './customer-detail/ContactCard';
import CustomerDetailHeader from './customer-detail/CustomerDetailHeader';
import CustomerDetailSkeleton from './customer-detail/CustomerDetailSkeleton';
import LifetimeMetricsCard from './customer-detail/LifetimeMetricsCard';
import OrderHistorySection from './customer-detail/OrderHistorySection';
import RecentSkusCard from './customer-detail/RecentSkusCard';
import SkuVelocityCard from './customer-detail/SkuVelocityCard';

const CustomerDetailComponent = () => {
	const { id } = useParams();
	const { data: customer, isLoading, error } = useCustomerDetail(id as string);

	if (isLoading) return <CustomerDetailSkeleton />;

	if (error)
		return <AlertMessage message={error.message} variant='destructive' />;

	if (!customer) return null;

	return (
		<div className='space-y-6 p-2'>
			<CustomerDetailHeader customer={customer} />

			<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
				<ContactCard customer={customer} />
				<LifetimeMetricsCard customer={customer} />
				<RecentSkusCard customer={customer} />
			</div>

			{customer.isB2B && <SkuVelocityCard data={customer.skuVelocity} />}

			<OrderHistorySection customer={customer} />
		</div>
	);
};

export default CustomerDetailComponent;
