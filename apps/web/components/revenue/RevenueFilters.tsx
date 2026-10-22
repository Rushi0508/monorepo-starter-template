'use client';

import { ChannelEnum } from '@repo/enums/dist';
import type { RevenueFilterType } from '@repo/types';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { monthRange, parseDatePickerValue, toYYYYMMDD } from '@repo/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSkuOptions } from '@/queries';
import { FilterDialog } from '../filters/FilterDialog';
import { FilterField } from '../filters/FilterField';
import { DateRangePresetPicker } from '../general/DateRangePresetPicker';

export const EMPTY_REVENUE_FILTERS: RevenueFilterType = {
	skus: [],
	channels: [],
	orderDateStart: toYYYYMMDD(monthRange.from ?? new Date()),
	orderDateEnd: toYYYYMMDD(monthRange.to ?? new Date()),
	chartBy: 'channel',
	breakdownBy: 'channel',
};

// Exactly the keys rendered inside the FilterDialog — drives the badge count
const DIALOG_FILTER_KEYS = new Set<keyof RevenueFilterType>([
	'channels',
	'skus',
]);

interface RevenueFiltersProps {
	appliedFilters: RevenueFilterType;
	onApply: (filters: RevenueFilterType) => void;
}

const RevenueFilters = ({ appliedFilters, onApply }: RevenueFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filters, setFilters] = useState<RevenueFilterType>(appliedFilters);

	const { data: skuOptions = [] } = useSkuOptions();

	const setFilter = <K extends keyof RevenueFilterType>(
		key: K,
		value: RevenueFilterType[K]
	) => setFilters((prev) => ({ ...prev, [key]: value }));

	const handleApply = () => {
		onApply(filters);
		setIsOpen(false);
	};

	// Clearing the dialog's filters leaves the chart and table views as they are
	const handleClearAll = () => {
		const cleared: RevenueFilterType = {
			...EMPTY_REVENUE_FILTERS,
			chartBy: appliedFilters.chartBy,
			breakdownBy: appliedFilters.breakdownBy,
		};
		setFilters(cleared);
		onApply(cleared);
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

	const skuSelectOptions = skuOptions.map((s) => ({
		label: `${s.sku}${s.title !== s.sku ? ` — ${s.title}` : ''}`,
		value: s.sku,
	}));

	// Date range changes apply immediately without opening the dialog
	const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
		const next: RevenueFilterType = {
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
				placeholder='Select date range'
			/>

			<FilterDialog
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				activeFiltersCount={activeFiltersCount}
				onApply={handleApply}
				onClearAll={handleClearAll}
				description='Filter revenue by SKU or channel'
			>
				<div className='grid grid-cols-1 gap-4'>
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
						<FilterField label='SKU'>
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

export default RevenueFilters;
