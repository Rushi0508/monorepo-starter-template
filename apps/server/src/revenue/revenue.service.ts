import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { ChannelEnum } from '@repo/enums';
import type {
	GetRevenueResponseType,
	OrderLineItem,
	RevenueBreakdownRow,
	RevenueDailyPoint,
	RevenueMetrics,
	RevenueTotals,
} from '@repo/types';
import {
	applyChannelFilter,
	calculateCogs,
	calculateFulfillmentCost,
	calculateGrossRevenue,
	calculateLineFulfillmentCosts,
	calculateNetRevenue,
	calculateTotalRefunds,
	endOfDayInTimeZone,
	formatDayKeyInTimeZone,
	getChannel,
	startOfDayInTimeZone,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import { SkuCostService } from 'src/sku/sku-cost.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';

// ─── Round to 2dp ─────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (num: number, denom: number) =>
	denom === 0 ? 0 : Math.round((num / denom) * 10000) / 100;

type FulfillmentLine = Parameters<
	typeof calculateFulfillmentCost
>[0]['lineItems'][number];

/** A channel's day; orders only decide whether the channel appears that day. */
type ChannelDay = RevenueTotals & { orders: number };

/** Line-item totals the breakdown is built from. */
type LineTotals = {
	cases: number;
	grossRevenue: number;
	netRevenue: number;
	cogs: number;
	fulfillmentCost: number;
};

/** One SKU's line totals within one channel. */
type SkuChannelLine = LineTotals & {
	sku: string;
	title: string | null;
	channel: ChannelEnum;
};

const emptyTotals = (): LineTotals => ({
	cases: 0,
	grossRevenue: 0,
	netRevenue: 0,
	cogs: 0,
	fulfillmentCost: 0,
});

const sumTotals = (lines: LineTotals[]): LineTotals => {
	const totals = emptyTotals();
	for (const line of lines) {
		totals.cases += line.cases;
		totals.grossRevenue += line.grossRevenue;
		totals.netRevenue += line.netRevenue;
		totals.cogs += line.cogs;
		totals.fulfillmentCost += line.fulfillmentCost;
	}
	return totals;
};

/** Margins are worked out from summed totals, since percentages can't be added. */
const toBreakdownRow = (
	key: string,
	label: string,
	totals: LineTotals
): RevenueBreakdownRow => ({
	key,
	label,
	cases: totals.cases,
	grossRevenue: r2(totals.grossRevenue),
	netRevenue: r2(totals.netRevenue),
	grossMarginPercentage: pct(
		totals.netRevenue - totals.cogs,
		totals.netRevenue
	),
	contributionMarginPercentage: pct(
		totals.netRevenue - totals.cogs - totals.fulfillmentCost,
		totals.netRevenue
	),
});

const roundDayTotals = (totals: RevenueTotals): RevenueTotals => ({
	gross: r2(totals.gross),
	net: r2(totals.net),
	cases: totals.cases,
});

const skuLabel = (line: SkuChannelLine) => line.title?.trim() || line.sku;

const byNetRevenueDesc = (
	a: { netRevenue: number },
	b: { netRevenue: number }
) => b.netRevenue - a.netRevenue;

const groupLines = <K extends string>(
	lines: SkuChannelLine[],
	keyOf: (line: SkuChannelLine) => K
) => {
	const groups = new Map<K, SkuChannelLine[]>();
	for (const line of lines) {
		const key = keyOf(line);
		groups.set(key, [...(groups.get(key) ?? []), line]);
	}
	return groups;
};

/** Discounts Shopify allocated to one line item. */
const lineDiscounts = (li: { discountAllocations: unknown }) =>
	(
		(li.discountAllocations as OrderLineItem['discountAllocations']) ?? []
	).reduce(
		(acc, curr) => acc + parseFloat(curr.allocatedAmountSet.shopMoney.amount),
		0
	);

/** Refunded product value (before tax) on one line item. */
const lineRefunds = (li: { refundLineItems: { subtotal: number | null }[] }) =>
	li.refundLineItems.reduce((acc, curr) => acc + (curr.subtotal ?? 0), 0);

@Injectable()
export class RevenueService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly skuCostService: SkuCostService
	) {}

	async getRevenue(
		query: RevenueQueryDto,
		timeZone: string
	): Promise<GetRevenueResponseType> {
		const {
			skus,
			channels,
			orderDateStart,
			orderDateEnd,
			chartBy = 'channel',
			breakdownBy = 'channel',
		} = query;

		const catalog = await loadSkuCatalog(this.prisma);
		const skuCodes = skus?.length ? catalog.expand(skus) : undefined;

		// ── 1. Build order where clause ───────────────────────────────────────────
		const orderWhere: Prisma.ShopifyOrderWhereInput = {};

		if (orderDateStart || orderDateEnd) {
			orderWhere.shopifyCreatedAt = {};
			// "YYYY-MM-DD" is the user's calendar day — resolve it in their timezone
			if (orderDateStart) {
				orderWhere.shopifyCreatedAt.gte = startOfDayInTimeZone(
					orderDateStart,
					timeZone
				);
			}
			if (orderDateEnd) {
				orderWhere.shopifyCreatedAt.lte = endOfDayInTimeZone(
					orderDateEnd,
					timeZone
				);
			}
		}

		if (skuCodes) {
			orderWhere.lineItems = { some: { sku: { in: skuCodes } } };
		}

		if (channels) {
			applyChannelFilter(orderWhere, channels);
		}

		// ── 2. Fetch Shopify orders ───────────────────────────────────────────────
		const orders = await this.prisma.shopifyOrder.findMany({
			where: orderWhere,
			select: {
				id: true,
				shopifyId: true,
				tags: true,
				appName: true,
				totalPrice: true,
				subtotalPrice: true,
				totalDiscounts: true,
				totalShippingPrice: true,
				shopifyCreatedAt: true,
				cancelledAt: true,
				refunds: {
					select: {
						lineItems: { select: { totalTax: true } },
						transactions: {
							select: { amount: true, status: true },
						},
					},
				},
				lineItems: {
					select: {
						sku: true,
						title: true,
						currentQuantity: true,
						quantity: true,
						price: true,
						discountAllocations: true,
						totalDiscount: true,
						refundLineItems: {
							select: {
								subtotal: true,
							},
						},
					},
					...(skuCodes ? { where: { sku: { in: skuCodes } } } : {}),
				},
			},
		});

		// ── 3. BlueBox shipping + SKU costs for the loaded orders ────────────────
		// Scoping BlueBox to the exact shopifyId list ensures a 1:1 join (same
		// pattern as fulfillment.service.ts). Fetching all BlueBox orders globally
		// would include rows outside the date range.
		const shopifyIds = orders.map((o) => o.shopifyId);
		const [blueboxOrders, costs] = await Promise.all([
			shopifyIds.length
				? this.prisma.blueboxOrder.findMany({
						where: { externalId: { in: shopifyIds } },
						select: { externalId: true, shippingCost: true },
					})
				: Promise.resolve([]),
			this.skuCostService.loadLookup(
				orders.flatMap((o) => o.lineItems.map((li) => li.sku))
			),
		]);

		// ── 4. Build lookup maps ──────────────────────────────────────────────────

		// Actual shipping per Shopify order (externalId = shopifyId). Split
		// shipments are summed; an order whose BlueBox rows carry no shipping cost
		// stays unset, so its entered shipping cost is used instead.
		const blueboxShippingByShopifyId = new Map<string, number>();
		for (const bo of blueboxOrders) {
			if (!bo.externalId || bo.shippingCost == null) continue;
			blueboxShippingByShopifyId.set(
				bo.externalId,
				(blueboxShippingByShopifyId.get(bo.externalId) ?? 0) + bo.shippingCost
			);
		}

		// ── 5. Aggregate ──────────────────────────────────────────────────────────

		let grossRevenue = 0;
		let totalDiscounts = 0;
		let totalRefunds = 0;
		let fulfillmentCost = 0;

		const emptyDay = (): Record<ChannelEnum, ChannelDay> =>
			Object.fromEntries(
				Object.values(ChannelEnum).map((c) => [
					c,
					{ orders: 0, gross: 0, net: 0, cases: 0 },
				])
			) as Record<ChannelEnum, ChannelDay>;

		// Per-day revenue by channel, from whole orders. Always built: each day's
		// totals come from it, whichever split the chart asked for.
		const dailyMap = new Map<string, Record<ChannelEnum, ChannelDay>>();

		// Per-day revenue by SKU, from line items — only when the chart is by SKU
		const dailySkuMap = new Map<string, Map<string, RevenueTotals>>();

		// Line-item totals per SKU within each channel. The breakdown, and the
		// headline COGS and cases, are all built from these.
		const skuChannelMap = new Map<string, SkuChannelLine>();

		// Distinct orders per channel, for channel breakdown rows
		const ordersByChannel = new Map<ChannelEnum, number>();

		for (const order of orders) {
			if (order.cancelledAt) continue;

			const orderGrossRevenue = calculateGrossRevenue({
				shipping: order.totalShippingPrice,
				lineItems: order.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				})),
			});

			const orderDiscounts = order.totalDiscounts ?? 0;

			const orderRefunds = calculateTotalRefunds({
				refunds: order.refunds,
			});

			const orderNetRevenue = calculateNetRevenue({
				grossRevenue: orderGrossRevenue,
				totalDiscounts: orderDiscounts,
				totalRefunds: orderRefunds,
			});

			grossRevenue += orderGrossRevenue;
			totalDiscounts += orderDiscounts;
			totalRefunds += orderRefunds;

			const channel = getChannel({
				tags: order.tags,
				appName: order.appName,
			});
			ordersByChannel.set(channel, (ordersByChannel.get(channel) ?? 0) + 1);

			// Costs are priced as of the order date, so entering a new cost version
			// never rewrites a past period's margins
			const dayKey = order.shopifyCreatedAt
				? formatDayKeyInTimeZone(order.shopifyCreatedAt, timeZone)
				: null;

			// Same predicate as the line aggregation below, so the chart's quantity
			// series always adds up to metrics.totalCasesSold.
			const orderCases = order.lineItems.reduce(
				(sum, li) =>
					li.sku && li.currentQuantity !== 0 ? sum + li.quantity : sum,
				0
			);

			if (dayKey) {
				const existing = dailyMap.get(dayKey) ?? emptyDay();
				existing[channel].orders += 1;
				existing[channel].gross += orderGrossRevenue;
				existing[channel].net += orderNetRevenue;
				existing[channel].cases += orderCases;
				dailyMap.set(dayKey, existing);
			}

			// Shipping is charged per order, so the breakdown shares it across the
			// order's lines by units, like BlueBox's shipping cost. What's left of the
			// order's discounts and refunds after its products' own is the part on
			// shipping; it comes off that share, which never goes below zero.
			const shippingCharged = order.totalShippingPrice ?? 0;
			const shippingDiscount = Math.min(
				shippingCharged,
				Math.max(
					0,
					orderDiscounts -
						order.lineItems.reduce((sum, li) => sum + lineDiscounts(li), 0)
				)
			);
			const shippingRefund = Math.min(
				shippingCharged - shippingDiscount,
				Math.max(
					0,
					orderRefunds -
						order.lineItems.reduce((sum, li) => sum + lineRefunds(li), 0)
				)
			);

			const fulfillmentLines: FulfillmentLine[] = [];
			const lineKeys: string[] = [];

			// Line items. A cost not entered in SKU settings counts as $0.
			for (const li of order.lineItems) {
				if (!li.sku || li.currentQuantity === 0) continue;
				const sku = catalog.canonical(li.sku);

				const shippingShare = orderCases > 0 ? li.quantity / orderCases : 0;
				const liGrossRevenue = calculateGrossRevenue({
					lineItems: [{ quantity: li.quantity, price: li.price ?? 0 }],
					shipping: shippingCharged * shippingShare,
				});
				const liNetRevenue = calculateNetRevenue({
					grossRevenue: liGrossRevenue,
					totalDiscounts: lineDiscounts(li) + shippingDiscount * shippingShare,
					totalRefunds: lineRefunds(li) + shippingRefund * shippingShare,
				});

				const cogsVersion = dayKey ? costs.cogs(li.sku, dayKey) : null;
				const fulfillmentVersion = dayKey
					? costs.fulfillment(li.sku, channel, dayKey)
					: null;

				const liCogs = calculateCogs({
					lineItems: [
						{ quantity: li.quantity, cogsPerUnit: cogsVersion?.amount ?? 0 },
					],
				});

				const key = `${channel}|${sku}`;
				const line = skuChannelMap.get(key) ?? {
					sku,
					title: li.title,
					channel,
					...emptyTotals(),
				};
				line.cases += li.quantity;
				line.grossRevenue += liGrossRevenue;
				line.netRevenue += liNetRevenue;
				line.cogs += liCogs;
				skuChannelMap.set(key, line);

				lineKeys.push(key);
				fulfillmentLines.push({
					quantity: li.quantity,
					storage: fulfillmentVersion?.storage ?? 0,
					pick: fulfillmentVersion?.pick ?? 0,
					pack: fulfillmentVersion?.pack ?? 0,
					shipping: fulfillmentVersion?.shipping ?? 0,
				});

				if (dayKey && chartBy === 'sku') {
					const daySkus =
						dailySkuMap.get(dayKey) ?? new Map<string, RevenueTotals>();
					const daySku = daySkus.get(sku) ?? { gross: 0, net: 0, cases: 0 };
					daySku.gross += liGrossRevenue;
					daySku.net += liNetRevenue;
					daySku.cases += li.quantity;
					daySkus.set(sku, daySku);
					dailySkuMap.set(dayKey, daySkus);
				}
			}

			const blueboxShippingCost =
				blueboxShippingByShopifyId.get(order.shopifyId) ?? null;

			fulfillmentCost += calculateFulfillmentCost({
				lineItems: fulfillmentLines,
				blueboxShippingCost,
			});

			// Per-line fulfillment for the breakdown. BlueBox reports shipping for
			// the whole order, so it is shared across the order's lines by units.
			const lineFulfillmentCosts = calculateLineFulfillmentCosts({
				lineItems: fulfillmentLines,
				blueboxShippingCost,
			});
			for (const [index, cost] of lineFulfillmentCosts.entries()) {
				const key = lineKeys[index];
				const line = key ? skuChannelMap.get(key) : undefined;
				if (line) line.fulfillmentCost += cost;
			}
		}

		// ── 6. Derived metrics ────────────────────────────────────────────────────

		const lines = [...skuChannelMap.values()];

		const netRevenue = r2(
			calculateNetRevenue({
				grossRevenue,
				totalDiscounts,
				totalRefunds,
			})
		);

		const cogs = r2(lines.reduce((s, line) => s + line.cogs, 0));
		const totalCasesSold = lines.reduce((s, line) => s + line.cases, 0);

		const grossProfit = r2(netRevenue - cogs);
		const grossMargin = pct(grossProfit, netRevenue);
		const contributionProfit = r2(grossProfit - fulfillmentCost);
		const contributionMargin = pct(contributionProfit, netRevenue);

		const metrics: RevenueMetrics = {
			grossRevenue: r2(grossRevenue),
			discounts: r2(totalDiscounts),
			refunds: r2(totalRefunds),
			netRevenue,
			totalCasesSold,
			cogs,
			grossProfit,
			grossMarginPercentage: grossMargin,
			fulfillmentCost: r2(fulfillmentCost),
			contributionProfit,
			contributionMarginPercentage: contributionMargin,
		};

		// ── 7. Daily chart: only the split that was asked for ────────────────────

		const dailyRevenue: RevenueDailyPoint[] = [...dailyMap.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateKey, byChannel]) => {
				const channels = Object.values(ChannelEnum);
				const gross = channels.reduce((s, c) => s + byChannel[c].gross, 0);
				const net = channels.reduce((s, c) => s + byChannel[c].net, 0);
				const cases = channels.reduce((s, c) => s + byChannel[c].cases, 0);

				const groups: [string, RevenueTotals][] =
					chartBy === 'sku'
						? [
								...(dailySkuMap.get(dateKey) ??
									new Map<string, RevenueTotals>()),
							]
						: channels
								.filter((c) => byChannel[c].orders > 0)
								.map((c) => [c, byChannel[c]]);

				return {
					date: dateKey,
					gross: r2(gross),
					net: r2(net),
					cases,
					groups: Object.fromEntries(
						groups.map(([key, totals]) => [key, roundDayTotals(totals)])
					),
				};
			});

		// ── 8. Breakdown: grouped as asked, with the other dimension as children ──

		const breakdown: RevenueBreakdownRow[] =
			breakdownBy === 'sku'
				? [...groupLines(lines, (line) => line.sku).entries()].map(
						([sku, skuLines]) => ({
							...toBreakdownRow(
								sku,
								skuLines[0] ? skuLabel(skuLines[0]) : sku,
								sumTotals(skuLines)
							),
							children: skuLines
								.map((line) => toBreakdownRow(line.channel, line.channel, line))
								.sort(byNetRevenueDesc),
						})
					)
				: [...groupLines(lines, (line) => line.channel).entries()].map(
						([rowChannel, channelLines]) => ({
							...toBreakdownRow(
								rowChannel,
								rowChannel,
								sumTotals(channelLines)
							),
							orders: ordersByChannel.get(rowChannel) ?? 0,
							children: channelLines
								.map((line) => toBreakdownRow(line.sku, skuLabel(line), line))
								.sort(byNetRevenueDesc),
						})
					);

		return {
			metrics,
			chartBy,
			breakdownBy,
			dailyRevenue,
			breakdown: breakdown.sort(byNetRevenueDesc),
		};
	}
}
