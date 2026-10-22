'use client';

import { tooltips } from '@repo/constants';
import { ChannelEnum } from '@repo/enums';
import type { DemandAccuracyFilterType } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { MultiSelect } from '@repo/ui/components/multi-select';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { RotateCcw } from 'lucide-react';
import { useSkuOptions } from '@/queries';
import { FilterField } from '../shared/FilterField';
import { periodLabelLong } from '../shared/period';

export const EMPTY_DEMAND_ACCURACY_FILTERS: DemandAccuracyFilterType = {
	demandPeriod: undefined,
	lag: undefined,
	channels: [],
	skuSettingIds: [],
};

const CHANNEL_OPTIONS = Object.values(ChannelEnum).map((channel) => ({
	label: channel,
	value: channel,
}));

interface AccuracyFiltersProps {
	appliedFilters: DemandAccuracyFilterType;
	onApply: (filters: DemandAccuracyFilterType) => void;
	availablePeriods: string[];
	availableLags: number[];
	activePeriod?: string;
	activeLag?: number;
}

const AccuracyFilters = ({
	appliedFilters,
	onApply,
	availablePeriods,
	availableLags,
	activePeriod,
	activeLag,
}: AccuracyFiltersProps) => {
	const { data: skuOptions = [] } = useSkuOptions();

	const setFilter = <K extends keyof DemandAccuracyFilterType>(
		key: K,
		value: DemandAccuracyFilterType[K]
	) => onApply({ ...appliedFilters, [key]: value });

	const skuSelectOptions = skuOptions.map((option) => ({
		label: option.sku,
		value: option.id,
	}));

	const isNarrowed =
		(appliedFilters.channels?.length ?? 0) > 0 ||
		(appliedFilters.skuSettingIds?.length ?? 0) > 0;

	return (
		<div className='flex flex-wrap items-start gap-3 border-b pb-4'>
			<FilterField label='Period' tooltip={tooltips.demandPlanningPage.period}>
				<Select
					value={activePeriod ?? ''}
					onValueChange={(value) => setFilter('demandPeriod', value)}
					disabled={availablePeriods.length === 0}
				>
					<SelectTrigger className='w-40 text-xs'>
						<SelectValue placeholder='No closed months' />
					</SelectTrigger>
					<SelectContent>
						{[...availablePeriods].reverse().map((period) => (
							<SelectItem key={period} value={period} className='text-xs'>
								{periodLabelLong(period)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</FilterField>

			<FilterField label='Channel'>
				<MultiSelect
					options={CHANNEL_OPTIONS}
					defaultValue={appliedFilters.channels ?? []}
					onValueChange={(values) =>
						setFilter('channels', values as ChannelEnum[])
					}
					placeholder='All channels'
					maxCount={1}
					className='min-h-9 w-70 py-0 text-xs'
				/>
			</FilterField>

			{skuSelectOptions.length > 0 && (
				<FilterField label='SKU'>
					<MultiSelect
						options={skuSelectOptions}
						defaultValue={appliedFilters.skuSettingIds ?? []}
						onValueChange={(values) => setFilter('skuSettingIds', values)}
						placeholder='All SKUs'
						maxCount={1}
						className='min-h-9 w-70 py-0 text-xs'
					/>
				</FilterField>
			)}

			{isNarrowed && (
				<Button
					variant='ghost'
					size='sm'
					className='mt-5 h-9 text-xs text-muted-foreground'
					onClick={() =>
						onApply({ ...appliedFilters, channels: [], skuSettingIds: [] })
					}
				>
					<RotateCcw className='size-3.5' />
					Reset
				</Button>
			)}

			<div className='ml-auto'>
				<FilterField label='Lag' tooltip={tooltips.demandPlanningPage.lag}>
					<Select
						value={activeLag ? String(activeLag) : ''}
						onValueChange={(value) => setFilter('lag', Number(value))}
					>
						<SelectTrigger className='w-40 text-xs'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableLags.map((lag) => (
								<SelectItem key={lag} value={String(lag)} className='text-xs'>
									{`Lag ${lag} · ${lag} mo ahead`}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</FilterField>
			</div>
		</div>
	);
};

export default AccuracyFilters;
