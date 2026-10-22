'use client';

import {
	CHART_GRANULARITIES,
	CHART_GRANULARITY_LABELS,
	CHART_GRANULARITY_SHORT_LABELS,
	type ChartGranularity,
} from '@repo/utils';
import { SegmentedToggle } from './SegmentedToggle';

interface ChartGranularityToggleProps {
	value: ChartGranularity;
	onChange: (granularity: ChartGranularity) => void;
	className?: string;
}

/**
 * Segmented D / W / M / Q control shown in a chart card header. The active
 * value is picked automatically from the selected date range — this only
 * overrides it for that chart.
 */
export function ChartGranularityToggle({
	value,
	onChange,
	className,
}: ChartGranularityToggleProps) {
	return (
		<SegmentedToggle
			value={value}
			onChange={onChange}
			ariaLabel='Chart granularity'
			className={className}
			options={CHART_GRANULARITIES.map((granularity) => ({
				value: granularity,
				label: CHART_GRANULARITY_SHORT_LABELS[granularity],
				title: CHART_GRANULARITY_LABELS[granularity],
			}))}
		/>
	);
}

export default ChartGranularityToggle;
