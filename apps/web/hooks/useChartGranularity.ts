'use client';

import {
	type ChartGranularity,
	getDateSpanInDays,
	getDefaultGranularity,
	resolveGranularity,
} from '@repo/utils';
import { useMemo, useState } from 'react';

interface UseChartGranularityParams {
	dateStart?: string;
	dateEnd?: string;
	/**
	 * The chart's own points, used to derive the span when the date filter is
	 * open-ended (e.g. "All time" leaves both bounds undefined).
	 */
	points?: readonly { date: string }[];
}

/**
 * Picks the trend bucket size (daily → quarterly) from the selected date range,
 * while letting the user override it per chart. The override resets whenever
 * the date range changes so a new range always starts from the default.
 */
export function useChartGranularity({
	dateStart,
	dateEnd,
	points,
}: UseChartGranularityParams) {
	const rangeKey = `${dateStart ?? ''}~${dateEnd ?? ''}`;

	// Reset-on-prop-change: keep the override alongside the range it belongs to
	const [state, setState] = useState<{
		rangeKey: string;
		override: ChartGranularity | null;
	}>({ rangeKey, override: null });

	const override = state.rangeKey === rangeKey ? state.override : null;

	const defaultGranularity = useMemo<ChartGranularity>(() => {
		if (dateStart && dateEnd) return getDefaultGranularity(dateStart, dateEnd);
		return resolveGranularity(
			getDateSpanInDays(points?.at(0)?.date, points?.at(-1)?.date)
		);
	}, [dateStart, dateEnd, points]);

	return {
		granularity: override ?? defaultGranularity,
		setGranularity: (granularity: ChartGranularity) =>
			setState({ rangeKey, override: granularity }),
		isAuto: override === null,
	};
}
