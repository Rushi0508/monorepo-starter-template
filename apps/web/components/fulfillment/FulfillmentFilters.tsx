'use client';

import { ChannelEnum, FulfillmentStatusEnum } from '@repo/enums';
import type { FulfillmentFilterType } from '@repo/types';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { monthRange, parseDatePickerValue, toYYYYMMDD } from '@repo/utils';
import { useEffect, useMemo, useState } from 'react';
import { FilterDialog } from '../filters/FilterDialog';
import { FilterField } from '../filters/FilterField';
import { DateRangePresetPicker } from '../general/DateRangePresetPicker';

const FULFILLMENT_STATUS_OPTIONS = Object.values(FulfillmentStatusEnum).map(
	(v) => ({
		label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		value: v,
	})
);

export const EMPTY_FULFILLMENT_FILTERS: FulfillmentFilterType = {
	search: '',
	orderDateStart: toYYYYMMDD(monthRange.from ?? new Date()),
	orderDateEnd: toYYYYMMDD(monthRange.to ?? new Date()),
	channels: [],
	fulfillmentStatus: [],
	sortBy: undefined,
	sortOrder: undefined,
	page: 1,
	limit: 10,
};

const DIALOG_FILTER_KEYS = new Set<keyof FulfillmentFilterType>([
	'channels',
	'fulfillmentStatus',
]);

interface FulfillmentFiltersProps {
	appliedFilters: FulfillmentFilterType;
	onApply: (filters: FulfillmentFilterType) => void;
}

const FulfillmentFilters = ({
	appliedFilters,
	onApply,
}: FulfillmentFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filters, setFilters] = useState<FulfillmentFilterType>(appliedFilters);

	const setFilter = <K extends keyof FulfillmentFilterType>(
		key: K,
		value: FulfillmentFilterType[K]
	) => setFilters((prev) => ({ ...prev, [key]: value }));

	const handleApply = () => {
		onApply(filters);
		setIsOpen(false);
	};

	const handleClearAll = () => {
		setFilters(EMPTY_FULFILLMENT_FILTERS);
		onApply(EMPTY_FULFILLMENT_FILTERS);
		setIsOpen(false);
	};

	const activeFiltersCount = useMemo(() => {
		return [...DIALOG_FILTER_KEYS].reduce((count, key) => {
			const value = appliedFilters[key];
			if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
			return count + (value != null && value !== '' ? 1 : 0);
		}, 0);
	}, [appliedFilters]);

	useEffect(() => {
		setFilters(appliedFilters);
	}, [appliedFilters]);

	// Date range changes apply immediately without opening the dialog
	const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
		const next: FulfillmentFilterType = {
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
				sectionLabel='Order date'
				placeholder='Select date range'
			/>

			<FilterDialog
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				activeFiltersCount={activeFiltersCount}
				onApply={handleApply}
				onClearAll={handleClearAll}
				description='Filter fulfillment orders'
			>
				<div className='grid grid-cols-2 gap-4'>
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

					<FilterField label='Fulfillment Status'>
						<MultiSelect
							options={FULFILLMENT_STATUS_OPTIONS}
							defaultValue={filters.fulfillmentStatus ?? []}
							onValueChange={(values) => setFilter('fulfillmentStatus', values)}
							placeholder='Any fulfillment status'
							maxCount={2}
						/>
					</FilterField>
				</div>
			</FilterDialog>
		</div>
	);
};

export default FulfillmentFilters;
