'use client';

import { tooltips } from '@repo/constants';
import {
	formatMoney,
	formatNumber,
	formatSignedNumber,
	formatSignedPercent,
	missToneClass,
} from '../shared/format';
import { KpiCard } from '../shared/KpiCard';
import { type ComparisonTotals, revenueDelta, unitsDelta } from './data';

export function CompareKpiCards({ total }: { total: ComparisonTotals }) {
	const t = tooltips.demandPlanningPage;

	const delta = revenueDelta(total);
	const share = (value: number) =>
		total.revenueA === 0 ? null : value / total.revenueA;

	const totalPct = share(delta);
	const volumePct = share(total.volumeEffect);
	const pricePct = share(total.priceEffect);
	const scopePct = share(total.scopeEffect);
	const hasScopeChange = Math.abs(total.scopeEffect) >= 0.5;

	return (
		<div
			className={`grid grid-cols-2 gap-3 ${
				hasScopeChange ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
			}`}
		>
			<KpiCard
				label='Total growth'
				value={totalPct === null ? '—' : formatSignedPercent(totalPct)}
				valueClassName={missToneClass(delta)}
				hint={`${formatMoney(delta)} · ${formatSignedNumber(unitsDelta(total))} cases`}
				tooltip={t.totalGrowth}
			/>

			<KpiCard
				label='Volume growth'
				value={volumePct === null ? '—' : formatSignedPercent(volumePct)}
				valueClassName={missToneClass(total.volumeEffect)}
				hint={`${formatMoney(total.volumeEffect)} · changes what you buy`}
				tooltip={t.volumeGrowth}
			/>

			<KpiCard
				label='Price growth'
				value={pricePct === null ? '—' : formatSignedPercent(pricePct)}
				valueClassName={missToneClass(total.priceEffect)}
				hint={`${formatMoney(total.priceEffect)} · same cases`}
				tooltip={t.priceGrowth}
			/>

			{hasScopeChange && (
				<KpiCard
					label='Scope change'
					value={scopePct === null ? '—' : formatSignedPercent(scopePct)}
					valueClassName={missToneClass(total.scopeEffect)}
					hint={`${formatMoney(total.scopeEffect)} · SKUs added or dropped`}
					tooltip='Revenue from channel and SKU pairs one plan covers and the other does not. There is no comparable price on the other side, so this movement cannot be split into volume and price — it is the plan changing what it covers, not what it expects.'
				/>
			)}

			<KpiCard
				label='Planned revenue'
				value={formatMoney(total.revenueB)}
				hint={`${formatNumber(total.unitsB)} cases · was ${formatMoney(total.revenueA)}`}
				tooltip={t.plannedRevenue}
			/>
		</div>
	);
}
