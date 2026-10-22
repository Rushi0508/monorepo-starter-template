'use client';

import {
	ChannelEnum,
	FulfillmentStatusEnum,
	PaymentStatusEnum,
} from '@repo/enums/dist';
import type { OrderFilterType } from '@repo/types';
import { MultiSelect } from '@repo/ui/components/multi-select';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { parseDatePickerValue, toYYYYMMDD } from '@repo/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSkuOptions } from '@/queries';
import { FilterDialog } from '../filters/FilterDialog';
import { FilterField } from '../filters/FilterField';
import { DateRangePicker } from '../general/DateRangePicker';
import { DateRangePresetPicker } from '../general/DateRangePresetPicker';

export const EMPTY_ORDER_FILTERS: OrderFilterType = {
	search: '',
	page: 1,
	limit: 20,
	paymentStatus: [],
	fulfillmentStatus: [],
	skus: [],
	channels: [],
	orderDateStart: undefined,
	orderDateEnd: undefined,
	estimatedDeliveryStart: undefined,
	estimatedDeliveryEnd: undefined,
	deliveredAtStart: undefined,
	deliveredAtEnd: undefined,
	isCancelled: undefined,
	orderType: undefined,
	sortBy: undefined,
	sortOrder: undefined,
};

const PAIRED_KEYS: Partial<
	Record<keyof OrderFilterType, keyof OrderFilterType>
> = {
	estimatedDeliveryEnd: 'estimatedDeliveryStart',
	deliveredAtEnd: 'deliveredAtStart',
};

// Exactly the keys rendered inside the FilterDialog — drives the badge count
const DIALOG_FILTER_KEYS = new Set<keyof OrderFilterType>([
	'isCancelled',
	'orderType',
	'estimatedDeliveryStart',
	'estimatedDeliveryEnd',
	'deliveredAtStart',
	'deliveredAtEnd',
	'paymentStatus',
	'fulfillmentStatus',
	'channels',
	'skus',
]);

const PAYMENT_STATUS_OPTIONS = Object.values(PaymentStatusEnum).map((v) => ({
	label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
	value: v,
}));

const FULFILLMENT_STATUS_OPTIONS = Object.values(FulfillmentStatusEnum).map(
	(v) => ({
		label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		value: v,
	})
);

interface OrdersFiltersProps {
	appliedFilters: OrderFilterType;
	onApply: (filters: OrderFilterType) => void;
}

const OrdersFilters = ({ appliedFilters, onApply }: OrdersFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filters, setFilters] = useState<OrderFilterType>(appliedFilters);

	const { data: skuOptions = [] } = useSkuOptions();

	const setFilter = <K extends keyof OrderFilterType>(
		key: K,
		value: OrderFilterType[K]
	) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

	const handleApply = () => {
		onApply(filters);
		setIsOpen(false);
	};

	const handleClearAll = () => {
		setFilters(EMPTY_ORDER_FILTERS);
		onApply(EMPTY_ORDER_FILTERS);
		setIsOpen(false);
	};

	const activeFiltersCount = useMemo(() => {
		return [...DIALOG_FILTER_KEYS].reduce((count, key) => {
			const primaryKey = PAIRED_KEYS[key];
			if (
				primaryKey &&
				appliedFilters[primaryKey] != null &&
				appliedFilters[primaryKey] !== ''
			)
				return count;
			const value = appliedFilters[key];
			if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
			return count + (value != null && value !== '' ? 1 : 0);
		}, 0);
	}, [appliedFilters]);

	useEffect(() => {
		setFilters(appliedFilters);
	}, [appliedFilters]);

	const skuSelectOptions = skuOptions.map((s) => ({
		label: `${s.sku}${s.title !== s.sku ? ` — ${s.title}` : ''}`,
		value: s.sku,
	}));

	// Date range changes apply immediately without opening the dialog
	const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
		const next: OrderFilterType = {
			...appliedFilters,
			orderDateStart: range?.from ? toYYYYMMDD(range.from) : undefined,
			orderDateEnd: range?.to ? toYYYYMMDD(range.to) : undefined,
		};
		setFilters(next);
		onApply(next);
	};

	return (
		<div className='flex items-center gap-2'>
			<DateRangePresetPicker
				value={{
					from: parseDatePickerValue(appliedFilters.orderDateStart),
					to: parseDatePickerValue(appliedFilters.orderDateEnd),
				}}
				onChange={handleDateChange}
				placeholder='Order date range'
			/>

			<FilterDialog
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				activeFiltersCount={activeFiltersCount}
				onApply={handleApply}
				onClearAll={handleClearAll}
				description='Filter orders by status, SKU, or date range'
			>
				<div className='grid grid-cols-2 gap-4'>
					<FilterField label='Cancellation'>
						<Select
							value={
								filters.isCancelled === true
									? 'true'
									: filters.isCancelled === false
										? 'false'
										: 'all'
							}
							onValueChange={(val) =>
								setFilter(
									'isCancelled',
									val === 'true' ? true : val === 'false' ? false : undefined
								)
							}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='All orders' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All orders</SelectItem>
								<SelectItem value='true'>Cancelled only</SelectItem>
								<SelectItem value='false'>Not cancelled</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>

					<FilterField label='Order Type'>
						<Select
							value={filters.orderType ?? 'all'}
							onValueChange={(val) =>
								setFilter(
									'orderType',
									val === 'all'
										? undefined
										: (val as OrderFilterType['orderType'])
								)
							}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='All types' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All types</SelectItem>
								<SelectItem value='normal'>Normal orders</SelectItem>
								<SelectItem value='bundle'>Bundle orders</SelectItem>
								<SelectItem value='subscription'>
									Subscription orders
								</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>

					<FilterField label='Est. Delivery Date'>
						<DateRangePicker
							value={{
								from: parseDatePickerValue(filters.estimatedDeliveryStart),
								to: parseDatePickerValue(filters.estimatedDeliveryEnd),
							}}
							onChange={(range) => {
								setFilter(
									'estimatedDeliveryStart',
									range?.from ? toYYYYMMDD(range.from) : undefined
								);
								setFilter(
									'estimatedDeliveryEnd',
									range?.to ? toYYYYMMDD(range.to) : undefined
								);
							}}
							placeholder='Select date range'
						/>
					</FilterField>

					<FilterField label='Delivered At'>
						<DateRangePicker
							value={{
								from: parseDatePickerValue(filters.deliveredAtStart),
								to: parseDatePickerValue(filters.deliveredAtEnd),
							}}
							onChange={(range) => {
								setFilter(
									'deliveredAtStart',
									range?.from ? toYYYYMMDD(range.from) : undefined
								);
								setFilter(
									'deliveredAtEnd',
									range?.to ? toYYYYMMDD(range.to) : undefined
								);
							}}
							placeholder='Select date range'
						/>
					</FilterField>

					<FilterField label='Payment Status'>
						<MultiSelect
							options={PAYMENT_STATUS_OPTIONS}
							defaultValue={filters.paymentStatus ?? []}
							onValueChange={(values) => setFilter('paymentStatus', values)}
							placeholder='Any payment status'
							maxCount={2}
						/>
					</FilterField>

					<FilterField label='Fulfillment Status'>
						<MultiSelect
							options={FULFILLMENT_STATUS_OPTIONS}
							defaultValue={filters.fulfillmentStatus ?? []}
							onValueChange={(values) => setFilter('fulfillmentStatus', values)}
							placeholder='Any fulfillment status'
							maxCount={2}
						/>
					</FilterField>

					<FilterField label='Channel'>
						<MultiSelect
							options={Object.values(ChannelEnum).map((channel) => ({
								label: channel,
								value: channel,
							}))}
							defaultValue={filters.channels ?? []}
							onValueChange={(values) =>
								setFilter('channels', values as ChannelEnum[])
							}
							placeholder='All channels'
							maxCount={3}
						/>
					</FilterField>

					{skuSelectOptions.length > 0 && (
						<FilterField label='SKU' className='col-span-2'>
							<MultiSelect
								options={skuSelectOptions}
								defaultValue={filters.skus ?? []}
								onValueChange={(values) => setFilter('skus', values)}
								placeholder='Filter by SKU'
								maxCount={3}
							/>
						</FilterField>
					)}
				</div>
			</FilterDialog>
		</div>
	);
};

export default OrdersFilters;
