'use client';

import { tooltips } from '@repo/constants';
import type { GetDemandAccuracyResponseType } from '@repo/types';
import {
	accuracyToneClass,
	formatNumber,
	formatPercent,
	formatSignedPercent,
} from '../shared/format';
import { KpiCard } from '../shared/KpiCard';
import { periodLabelLong } from '../shared/period';

interface AccuracyKpiCardsProps {
	accuracy: GetDemandAccuracyResponseType;
}

export function AccuracyKpiCards({ accuracy }: AccuracyKpiCardsProps) {
	const { summary, demandPeriod, lag, bias } = accuracy;
	const t = tooltips.demandPlanningPage;

	return (
		<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
			<KpiCard
				label='Accuracy'
				value={summary ? formatPercent(summary.accuracyPct) : '—'}
				valueClassName={
					summary ? accuracyToneClass(summary.accuracyPct) : undefined
				}
				hint={
					summary
						? `${periodLabelLong(demandPeriod)} · Lag ${summary.lag}`
						: `${periodLabelLong(demandPeriod)} · no plan to score against`
				}
				tooltip={t.accuracy}
			/>

			<KpiCard
				label='Forecast'
				value={summary ? formatNumber(summary.forecast) : '—'}
				hint={summary ? `${summary.planName} · cases` : '—'}
				tooltip={t.forecast}
			/>

			<KpiCard
				label='Actual'
				value={summary ? formatNumber(summary.actual) : '—'}
				hint={`${periodLabelLong(demandPeriod)} · cases`}
				tooltip={t.actual}
			/>

			<KpiCard
				label={bias ? `Bias · ${bias.months} mo` : 'Bias'}
				value={bias ? formatSignedPercent(bias.pct) : '—'}
				hint={
					bias
						? `Across all scored months at Lag ${lag} · ${
								bias.pct >= 0
									? 'we under-forecast demand'
									: 'we over-forecast demand'
							}`
						: 'Nothing scored at this lag yet'
				}
				tooltip={t.bias}
			/>
		</div>
	);
}
