import { Injectable } from '@nestjs/common';
import type { SkuChannelFulfillmentCost, SkuCogs } from '@repo/db';
import type { ChannelEnum } from '@repo/enums';
import type { OrderMargin } from '@repo/types';
import {
	calculateCogs,
	calculateFulfillmentCost,
	formatDayKeyInTimeZone,
	resolveEffectiveVersion,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog, skuKey } from './sku-catalog';

/** A SKU's cost versions in force on a calendar day ("YYYY-MM-DD"). */
export type SkuCostLookup = {
	cogs: (sku: string, dayKey: string) => SkuCogs | null;
	fulfillment: (
		sku: string,
		channel: ChannelEnum,
		dayKey: string
	) => SkuChannelFulfillmentCost | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (num: number, denom: number) =>
	denom === 0 ? 0 : Math.round((num / denom) * 10000) / 100;

/** BlueBox's actual shipping per Shopify order id; split shipments are summed. */
export const sumBlueboxShipping = (
	rows: { externalId: string | null; shippingCost: number | null }[]
): Map<string, number> => {
	const totals = new Map<string, number>();
	for (const row of rows) {
		if (!row.externalId || row.shippingCost == null) continue;
		totals.set(
			row.externalId,
			(totals.get(row.externalId) ?? 0) + row.shippingCost
		);
	}
	return totals;
};

const groupBy = <T>(rows: T[], key: (row: T) => string) => {
	const map = new Map<string, T[]>();
	for (const row of rows) {
		const k = key(row);
		map.set(k, [...(map.get(k) ?? []), row]);
	}
	return map;
};

@Injectable()
export class SkuCostService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Loads the COGS and channel fulfillment ladders for a set of SKU codes once,
	 * so a report can price every line item without a query per order.
	 */
	async loadLookup(
		skus: (string | null | undefined)[]
	): Promise<SkuCostLookup> {
		const catalog = await loadSkuCatalog(this.prisma);
		const idBySku = new Map<string, string>();
		for (const sku of skus) {
			const entry = catalog.resolve(sku);
			if (sku && entry) idBySku.set(skuKey(sku), entry.id);
		}
		const ids = [...new Set(idBySku.values())];

		const [cogs, fulfillment] = ids.length
			? await Promise.all([
					this.prisma.skuCogs.findMany({
						where: { skuSettingId: { in: ids } },
					}),
					this.prisma.skuChannelFulfillmentCost.findMany({
						where: { skuSettingId: { in: ids } },
					}),
				])
			: [[], []];

		const cogsBySetting = groupBy(cogs, (row) => row.skuSettingId);
		const fulfillmentBySeries = groupBy(
			fulfillment,
			(row) => `${row.skuSettingId}|${row.channel}`
		);

		return {
			cogs: (sku, dayKey) => {
				const id = idBySku.get(skuKey(sku));
				return id
					? resolveEffectiveVersion(cogsBySetting.get(id) ?? [], dayKey)
					: null;
			},
			fulfillment: (sku, channel, dayKey) => {
				const id = idBySku.get(skuKey(sku));
				return id
					? resolveEffectiveVersion(
							fulfillmentBySeries.get(`${id}|${channel}`) ?? [],
							dayKey
						)
					: null;
			},
		};
	}

	/**
	 * One order's P&L, top line to bottom line, priced with the SKU costs in force
	 * on its order date — the same figures the revenue page adds up. Costs not
	 * entered in SKU settings count as $0.
	 */
	calculateOrderMargin({
		lineItems,
		orderDate,
		channel,
		grossRevenue,
		totalDiscounts,
		totalRefunds,
		netRevenue,
		blueboxShippingCost,
		costs,
		timeZone,
	}: {
		lineItems: {
			sku: string | null;
			quantity: number;
			currentQuantity: number | null;
		}[];
		orderDate: Date | null;
		channel: ChannelEnum;
		grossRevenue: number;
		totalDiscounts: number;
		totalRefunds: number;
		netRevenue: number;
		blueboxShippingCost: number | null;
		costs: SkuCostLookup;
		timeZone?: string;
	}): OrderMargin {
		const dayKey = orderDate
			? formatDayKeyInTimeZone(orderDate, timeZone)
			: null;

		// Same lines the revenue page counts: with a SKU, and not fully removed
		const priced = lineItems.flatMap((li) => {
			if (!li.sku || li.currentQuantity === 0) return [];
			const cogs = dayKey ? costs.cogs(li.sku, dayKey) : null;
			const fulfillment = dayKey
				? costs.fulfillment(li.sku, channel, dayKey)
				: null;
			return [
				{
					quantity: li.quantity,
					cogsPerUnit: cogs?.amount ?? 0,
					storage: fulfillment?.storage ?? 0,
					pick: fulfillment?.pick ?? 0,
					pack: fulfillment?.pack ?? 0,
					shipping: fulfillment?.shipping ?? 0,
				},
			];
		});

		const cogs = calculateCogs({ lineItems: priced });
		const fulfillmentCost = calculateFulfillmentCost({
			lineItems: priced,
			blueboxShippingCost,
		});
		const grossProfit = netRevenue - cogs;
		const contributionProfit = grossProfit - fulfillmentCost;

		return {
			grossRevenue: r2(grossRevenue),
			discounts: r2(totalDiscounts),
			refunds: r2(totalRefunds),
			netRevenue: r2(netRevenue),
			cogs: r2(cogs),
			grossProfit: r2(grossProfit),
			grossMarginPercentage: pct(grossProfit, netRevenue),
			fulfillmentCost: r2(fulfillmentCost),
			contributionProfit: r2(contributionProfit),
			contributionMarginPercentage: pct(contributionProfit, netRevenue),
		};
	}
}
