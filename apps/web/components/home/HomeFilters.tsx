'use client';

import { ChannelEnum } from '@repo/enums/dist';
import type { DashboardFilterType } from '@repo/types';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { parseDatePickerValue, toYYYYMMDD } from '@repo/utils';
import { useEffect, useMemo, useState } from 'react';
import { FilterDialog } from '../filters/FilterDialog';
import { FilterField } from '../filters/FilterField';
import { DateRangePresetPicker } from '../general/DateRangePresetPicker';

// ─── Default: first → last day of current month ────────────────────────────────

function thisMonthDefaults(): DashboardFilterType {
	const now = new Date();
	return {
		dateStart: toYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1)),
		dateEnd: toYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
	};
}

export const EMPTY_HOME_FILTERS: DashboardFilterType = thisMonthDefaults();

// Exactly the keys rendered inside the FilterDialog — drives the badge count
const DIALOG_FILTER_KEYS = new Set<keyof DashboardFilterType>(['channels']);

interface HomeFiltersProps {
	appliedFilters: DashboardFilterType;
	onApply: (filters: DashboardFilterType) => void;
}

const HomeFilters = ({ appliedFilters, onApply }: HomeFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filters, setFilters] = useState<DashboardFilterType>(appliedFilters);

	const setFilter = <K extends keyof DashboardFilterType>(
		key: K,
		value: DashboardFilterType[K]
	) => setFilters((prev) => ({ ...prev, [key]: value }));

	const handleApply = () => {
		onApply(filters);
		setIsOpen(false);
	};

	const handleClearAll = () => {
		setFilters(EMPTY_HOME_FILTERS);
		onApply(EMPTY_HOME_FILTERS);
		setIsOpen(false);
	};

	// Date range changes apply immediately without opening the dialog
	const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
		const next: DashboardFilterType = {
			...appliedFilters,
			dateStart: range?.from ? toYYYYMMDD(range.from) : undefined,
			dateEnd: range?.to ? toYYYYMMDD(range.to) : undefined,
		};
		setFilters(next);
		onApply(next);
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

	return (
		<div className='flex items-center gap-2'>
			<DateRangePresetPicker
				value={{
					from: parseDatePickerValue(appliedFilters.dateStart),
					to: parseDatePickerValue(appliedFilters.dateEnd),
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
				description='Filter the dashboard'
			>
				<div className='grid grid-cols-2 gap-4'>
					<FilterField label='Channel' className='col-span-2'>
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
				</div>
			</FilterDialog>
		</div>
	);
};

export default HomeFilters;
