import type {
	DemandComparisonType,
	DemandForecastMethodType,
	DemandGridType,
	DemandPlanAuditType,
	DemandPlanListItemType,
	DemandPlanPricingType,
	DemandPlanType,
	DemandScenarioListItemType,
	GetDemandAccuracyResponseType,
} from '@repo/types';
import type { ToolDef } from '../types.js';
import {
	type DemandPlanningInput,
	type DemandPlanningView,
	demandPlanningInputSchema,
} from './schema.js';
import {
	shapeAccuracy,
	shapeAudits,
	shapeComparison,
	shapeForecastMethods,
	shapeGrid,
	shapePlan,
	shapePlanList,
	shapePricing,
	shapeScenarios,
} from './shape.js';

const ID_VIEWS = new Set<DemandPlanningView>([
	'plan',
	'grid',
	'forecast_methods',
	'pricing',
	'audits',
]);

function requireParam(
	value: string | undefined,
	name: string,
	view: string
): string {
	if (!value) {
		throw new Error(`view=${view} requires ${name}`);
	}
	return value;
}

function definedParams(
	params: Record<string, unknown>
): Record<string, unknown> | undefined {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		out[key] = value;
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

function csv(values?: string[]): string | undefined {
	if (!values?.length) return undefined;
	return values.join(',');
}

export const demandPlanningTool: ToolDef = {
	name: 'get_demand_planning',
	description:
		'Demand plans in units by channel and SKU: plan list, operative workspace plan, grid, forecast methods, plan pricing, audits, scenarios, plan comparison, and forecast accuracy. Use for planned demand, overrides, and forecast quality. Not for actual shipped revenue (get_revenue) or live stock (get_inventory). Default view=plans. Grid cells and pricing history need includeDetail; pass channel or skuSettingId for one series, and period (YYYY-MM) for a history month. Read-only.',
	inputSchema: demandPlanningInputSchema,
	handler: async (client, input) => {
		const parsed = input as DemandPlanningInput;
		const view: DemandPlanningView = parsed.view ?? 'plans';
		const pageOpts = { page: parsed.page, limit: parsed.limit };
		const includeDetail = Boolean(parsed.includeDetail);

		if (view === 'plans') {
			const plans =
				await client.get<DemandPlanListItemType[]>('/api/demand-plans');
			return shapePlanList(plans, pageOpts);
		}

		if (view === 'operative') {
			const plan = await client.get<DemandPlanType | null>(
				'/api/demand-plans/operative'
			);
			return { plan: plan ? shapePlan(plan, { includeDetail }) : null };
		}

		if (view === 'scenarios') {
			const scenarios = await client.get<DemandScenarioListItemType[]>(
				'/api/demand-plans/scenarios',
				definedParams({ basePlanId: parsed.basePlanId })
			);
			return shapeScenarios(scenarios, pageOpts);
		}

		if (view === 'compare') {
			const planAId = requireParam(parsed.planAId, 'planAId', view);
			const planBId = requireParam(parsed.planBId, 'planBId', view);
			const comparison = await client.get<DemandComparisonType>(
				'/api/demand-plans/compare',
				{ planAId, planBId }
			);
			return shapeComparison(comparison, pageOpts);
		}

		if (view === 'accuracy') {
			const accuracy = await client.get<GetDemandAccuracyResponseType>(
				'/api/demand-plans/accuracy',
				definedParams({
					demandPeriod: parsed.demandPeriod,
					lag: parsed.lag,
					channels: csv(parsed.channels),
					skuSettingIds: csv(parsed.skuSettingIds),
				})
			);
			return shapeAccuracy(accuracy);
		}

		const id = requireParam(parsed.id, 'id', view);
		if (!ID_VIEWS.has(view)) {
			throw new Error(`Unknown view: ${view}`);
		}

		if (view === 'plan') {
			const plan = await client.get<DemandPlanType>(`/api/demand-plans/${id}`);
			return shapePlan(plan, { includeDetail });
		}

		if (view === 'grid') {
			const grid = await client.get<DemandGridType>(
				`/api/demand-plans/${id}/grid`
			);
			return shapeGrid(grid, {
				includeDetail,
				channel: parsed.channel,
				skuSettingId: parsed.skuSettingId,
				period: parsed.period,
				...pageOpts,
			});
		}

		if (view === 'forecast_methods') {
			const methods = await client.get<DemandForecastMethodType[]>(
				`/api/demand-plans/${id}/forecast-methods`
			);
			return shapeForecastMethods(methods, pageOpts);
		}

		if (view === 'pricing') {
			const pricing = await client.get<DemandPlanPricingType>(
				`/api/demand-plans/${id}/pricing`
			);
			return shapePricing(pricing, {
				includeDetail,
				skuSettingId: parsed.skuSettingId,
				...pageOpts,
			});
		}

		const audits = await client.get<DemandPlanAuditType[]>(
			`/api/demand-plans/${id}/audits`
		);
		return shapeAudits(audits, pageOpts);
	},
};
