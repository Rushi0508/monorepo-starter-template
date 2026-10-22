import { tooltips } from '@repo/constants';
import type { GetCustomerDetailResponseType } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@repo/utils/string.utils';
import { formatDistanceToNow } from 'date-fns';
import { BarChart2 } from 'lucide-react';
import CustomTooltip from '@/components/general/CustomTooltip';

const cust = tooltips.customerPage;

interface MetricItemProps {
	label: string;
	value: string;
	valueClassName?: string;
	tooltip?: string;
}

const MetricItem = ({
	label,
	value,
	valueClassName,
	tooltip,
}: MetricItemProps) => (
	<div className='space-y-0.5'>
		<p className='flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
			{label}
			{tooltip && <CustomTooltip content={tooltip} />}
		</p>
		<p className={cn('text-xl font-bold', valueClassName)}>{value}</p>
	</div>
);

interface LifetimeMetricsCardProps {
	customer: GetCustomerDetailResponseType;
}

const LifetimeMetricsCard = ({ customer }: LifetimeMetricsCardProps) => {
	const { isB2B } = customer;

	return (
		<div className='rounded-xl border bg-card p-5 space-y-4'>
			<p className='flex items-center gap-2 text-sm font-semibold'>
				<BarChart2 className='size-3.5' />
				Lifetime metrics
			</p>
			<div className='grid grid-cols-3 gap-x-4 gap-y-5'>
				<MetricItem label='Orders' value={String(customer.totalOrders)} />
				<MetricItem
					label='Gross Revenue'
					value={formatCurrency(customer.grossRevenue)}
				/>
				<MetricItem
					label='Net Revenue'
					value={formatCurrency(customer.netRevenue)}
				/>
				<MetricItem
					label='Net AOV'
					value={formatCurrency(customer.netAov)}
					tooltip={cust.netAov}
				/>
				<MetricItem
					label='Gross Profit'
					value={formatCurrency(customer.grossProfit)}
					valueClassName={
						customer.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
					}
					tooltip={cust.grossProfit}
				/>
				<MetricItem
					label='Discounts'
					value={formatCurrency(customer.totalDiscounts)}
				/>
				{isB2B && (
					<MetricItem
						label='Case Volume'
						value={customer.caseVolume.toLocaleString()}
						tooltip={cust.caseVolume}
					/>
				)}
				<div className='col-span-2'>
					<MetricItem
						label='Last Order'
						valueClassName='text-base'
						value={
							customer.lastOrderDate
								? formatDistanceToNow(new Date(customer.lastOrderDate), {
										addSuffix: true,
									})
								: 'Never'
						}
					/>
				</div>
			</div>
		</div>
	);
};

export default LifetimeMetricsCard;
