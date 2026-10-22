import { notFound } from 'next/navigation';
import React from 'react';
import { BreadcrumbSegmentProvider } from '@/components/BreadcrumbSegmentProvider';
import { CustomersService } from '@/services';

interface CustomerDetailLayoutProps {
	children: React.ReactNode;
	params: Promise<{
		id: string;
	}>;
}

const CustomerDetailLayout = async ({
	children,
	params,
}: CustomerDetailLayoutProps) => {
	const { id } = await params;
	let customerName = '';

	try {
		const customer = await CustomersService.getCustomerDetail(id);
		customerName = customer.displayName;
		if (!customer) {
			return notFound();
		}
	} catch {
		return notFound();
	}
	return (
		<BreadcrumbSegmentProvider segment={id} name={customerName}>
			{children}
		</BreadcrumbSegmentProvider>
	);
};

export default CustomerDetailLayout;
