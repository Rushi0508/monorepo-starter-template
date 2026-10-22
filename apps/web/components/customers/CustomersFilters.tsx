import { US_STATES } from '@repo/constants';
import { ChannelEnum } from '@repo/enums';
import type { CustomerFilterType } from '@repo/types';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { parseDatePickerValue, toYYYYMMDD } from '@repo/utils';
import { useEffect, useMemo, useState } from 'react';
import { FilterDialog } from '../filters/FilterDialog';
import { FilterField } from '../filters/FilterField';
import CustomInput from '../general/CustomInput';
import { DateRangePresetPicker } from '../general/DateRangePresetPicker';

export const EMPTY_FILTERS: CustomerFilterType = {
	search: '',
	page: 1,
	limit: 10,
	minOrderCount: undefined,
	maxOrderCount: undefined,
	orderDateEnd: undefined,
	orderDateStart: undefined,
	states: [],
	channels: [],
	sortBy: undefined,
	sortOrder: undefined,
};

// maxOrderCount is secondary — skip it when minOrderCount is already active
const PAIRED_KEYS: Partial<
	Record<keyof CustomerFilterType, keyof CustomerFilterType>
> = {
	maxOrderCount: 'minOrderCount',
};

// Exactly the keys rendered inside the FilterDialog — drives the badge count
const DIALOG_FILTER_KEYS = new Set<keyof CustomerFilterType>([
	'minOrderCount',
	'maxOrderCount',
	'states',
	'channels',
]);

interface CustomersFiltersProps {
	appliedFilters: CustomerFilterType;
	onApply: (filters: CustomerFilterType) => void;
}

const CustomersFilters = ({
	appliedFilters,
	onApply,
}: CustomersFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [filters, setFilters] = useState<CustomerFilterType>(appliedFilters);

	const setFilter = <K extends keyof CustomerFilterType>(
		key: K,
		value: CustomerFilterType[K]
	) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

	const errorValues = useMemo(() => {
		const errors = [];
		const { minOrderCount, maxOrderCount } = filters;
		if (minOrderCount != null && minOrderCount < 0) {
			errors.push('Min order count must be greater than or equal to 0');
		}
		if (maxOrderCount != null && maxOrderCount < 0) {
			errors.push('Max order count must be greater than or equal to 0');
		}
		if (
			minOrderCount != null &&
			maxOrderCount != null &&
			maxOrderCount < minOrderCount
		) {
			errors.push(
				'Max order count must be greater than or equal to min order count'
			);
		}
		return errors;
	}, [filters]);

	const handleApply = () => {
		onApply(filters);
		setIsOpen(false);
	};

	const handleClearAll = () => {
		setFilters(EMPTY_FILTERS);
		onApply(EMPTY_FILTERS);
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

	// Date range changes apply immediately without opening the dialog
	const handleDateChange = (range: { from?: Date; to?: Date } | undefined) => {
		const next: CustomerFilterType = {
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
				applyDisabled={errorValues.length > 0}
			>
				<div className='grid grid-cols-2 gap-4'>
					<FilterField label='Order Count'>
						<div className='flex items-center gap-2'>
							<CustomInput
								type='number'
								min={0}
								step={1}
								placeholder='Min'
								value={filters.minOrderCount ?? ''}
								onChange={(val) =>
									setFilter(
										'minOrderCount',
										typeof val === 'number' ? val : undefined
									)
								}
							/>
							<span className='shrink-0 text-sm text-muted-foreground'>to</span>
							<CustomInput
								type='number'
								min={0}
								step={1}
								placeholder='Max'
								value={filters.maxOrderCount ?? ''}
								onChange={(val) =>
									setFilter(
										'maxOrderCount',
										typeof val === 'number' ? val : undefined
									)
								}
							/>
						</div>
					</FilterField>

					<FilterField label='State'>
						<MultiSelect
							options={US_STATES.map(({ label, value }) => ({ label, value }))}
							defaultValue={filters.states ?? []}
							onValueChange={(values) => setFilter('states', values)}
							placeholder='Select states'
							maxCount={3}
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
				</div>
				{errorValues.map((error) => (
					<p key={error} className='text-xs text-destructive'>
						{error}
					</p>
				))}
			</FilterDialog>
		</div>
	);
};

export default CustomersFilters;
