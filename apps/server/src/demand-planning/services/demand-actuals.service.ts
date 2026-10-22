import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@repo/db';
import type { ChannelEnum } from '@repo/enums';
import type { OrderLineItem } from '@repo/types';
import {
	BUSINESS_TIME_ZONE,
	calculateGrossRevenue,
	calculateNetRevenue,
	formatDayKeyInTimeZone,
	getChannel,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';

/**
 * Rolls Shopify orders into monthly units and revenue per channel x SKU —
 * the input to every statistical forecast, and the truth Forecast Accuracy is
 * scored against.
 *
 * Shopify is the only sales source: every channel it can identify is derived
 * from an order's appName and tags. BlueBox is fulfillment, SimplyDepo is a
 * catalogue.
 *
 * Revenue matches the Revenue page's basis, shipping included. Shipping is
 * billed per order, so each line takes a share of it proportional to its units;
 * the alternative, dropping it, left the same scope reading ~$1,000 lighter
 * here than on the Revenue page and made the two impossible to reconcile.
 *
 * Buckets are months in the business's own timezone, not the viewer's. A plan
 * has to be one number for everyone: if July held 470 units in Kolkata and 536
 * in Oregon, two planners would forecast the same month differently and
 * accuracy would score differently depending on who opened it.
 */

const r2 = (n: number) => Math.round(n * 100) / 100;

/** "YYYY-MM" for the business month an instant falls in. */
const monthKey = (date: Date): string =>
	formatDayKeyInTimeZone(date, BUSINESS_TIME_ZONE).slice(0, 7);

type Bucket = { units: number; grossRevenue: number; netRevenue: number };

@Injectable()
export class DemandActualsService {
	private readonly logger = new Logger(DemandActualsService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Recomputes every month from `from` (inclusive, "YYYY-MM") to now. Defaults
	 * to a full rebuild, which is cheap enough at this volume and avoids drift
	 * from refunds landing against old months.
	 */
	async refresh(from?: string): Promise<{ rows: number; months: number }> {
		const since = from ? new Date(`${from}-01T00:00:00.000Z`) : undefined;

		const orders = await this.prisma.shopifyOrder.findMany({
			where: {
				cancelledAt: null,
				shopifyCreatedAt: since ? { gte: since } : { not: null },
			},
			select: {
				tags: true,
				appName: true,
				shopifyCreatedAt: true,
				totalShippingPrice: true,
				lineItems: {
					select: {
						sku: true,
						quantity: true,
						currentQuantity: true,
						price: true,
						discountAllocations: true,
						refundLineItems: { select: { subtotal: true } },
					},
				},
			},
		});

		const catalog = await loadSkuCatalog(this.prisma);

		const buckets = new Map<string, Bucket>();
		const key = (channel: string, skuSettingId: string, period: string) =>
			`${channel}|${skuSettingId}|${period}`;

		let unmatched = 0;

		for (const order of orders) {
			if (!order.shopifyCreatedAt) continue;

			const channel = getChannel({
				tags: order.tags,
				appName: order.appName,
			});
			const period = monthKey(order.shopifyCreatedAt);

			// Shipping is charged once per order, so it has to be split before any
			// line can claim a share of it. The denominator is the units this run
			// will actually keep — spreading it over dropped lines would strand
			// part of the order's shipping and leave the table short of what
			// Shopify billed.
			const shippableUnits = order.lineItems.reduce(
				(sum, li) =>
					li.sku && li.currentQuantity !== 0 && catalog.resolve(li.sku)
						? sum + li.quantity
						: sum,
				0
			);
			const orderShipping = order.totalShippingPrice ?? 0;

			for (const li of order.lineItems) {
				// Same predicate as the revenue service, so units reconcile with
				// the "cases sold" figure shown elsewhere.
				if (!li.sku || li.currentQuantity === 0) continue;

				const skuSettingId = catalog.resolve(li.sku)?.id;
				if (!skuSettingId) {
					unmatched += 1;
					continue;
				}

				// By units, not by value: shipping tracks what moved, so two cases
				// of the same size carry the same freight whatever they sold for.
				const shipping =
					shippableUnits > 0
						? (orderShipping * li.quantity) / shippableUnits
						: 0;

				const grossRevenue = calculateGrossRevenue({
					shipping,
					lineItems: [{ quantity: li.quantity, price: li.price ?? 0 }],
				});
				const allocations =
					(li.discountAllocations as OrderLineItem['discountAllocations']) ??
					[];
				const totalDiscounts = allocations.reduce(
					(sum, a) =>
						sum + Number.parseFloat(a.allocatedAmountSet.shopMoney.amount),
					0
				);
				const totalRefunds = li.refundLineItems.reduce(
					(sum, r) => sum + (r.subtotal ?? 0),
					0
				);

				const k = key(channel, skuSettingId, period);
				const bucket = buckets.get(k) ?? {
					units: 0,
					grossRevenue: 0,
					netRevenue: 0,
				};
				bucket.units += li.quantity;
				// Both bases are kept: a plan is compared against gross, because a
				// forecast cannot anticipate discounts or refunds, while net is what
				// the Revenue page reports.
				bucket.grossRevenue += grossRevenue;
				bucket.netRevenue += calculateNetRevenue({
					grossRevenue,
					totalDiscounts,
					totalRefunds,
				});
				buckets.set(k, bucket);
			}
		}

		if (unmatched > 0) {
			// Not an error: a SKU absent from settings is out of the plannable
			// catalogue by definition. Logged because silently dropped sales are
			// the kind of thing that is painful to discover from a wrong forecast.
			this.logger.warn(
				`${unmatched} line items skipped — their SKU is not in SKU settings`
			);
		}

		const thisMonth = monthKey(new Date());
		const refreshedAt = new Date();
		const periods = new Set<string>();

		const rows = [...buckets.entries()].map(([k, bucket]) => {
			const [channel, skuSettingId, period] = k.split('|') as [
				string,
				string,
				string,
			];
			periods.add(period);
			return {
				channel: channel as ChannelEnum,
				skuSettingId,
				period,
				units: bucket.units,
				grossRevenue: r2(bucket.grossRevenue),
				netRevenue: r2(bucket.netRevenue),
				// The month in progress is not comparable to a closed one, and must
				// never be averaged in as though it were.
				isPartial: period === thisMonth,
				refreshedAt,
			};
		});

		await this.prisma.$transaction(async (tx) => {
			// Replace the recomputed window wholesale. An upsert alone would strand
			// rows whose sales were entirely refunded away since the last run.
			await tx.demandActual.deleteMany({
				where: from ? { period: { gte: from } } : {},
			});
			if (rows.length > 0) {
				await tx.demandActual.createMany({ data: rows });
			}
		});

		this.logger.log(
			`Demand actuals refreshed: ${rows.length} rows across ${periods.size} months`
		);
		return { rows: rows.length, months: periods.size };
	}

	/** Monthly actuals for a set of SKUs, oldest first — the forecast input. */
	async getActuals(params: {
		skuSettingIds: string[];
		channels?: ChannelEnum[];
		from?: string;
		to?: string;
	}) {
		const { skuSettingIds, channels, from, to } = params;

		const period: Prisma.StringFilter = {};
		if (from) period.gte = from;
		if (to) period.lte = to;

		return this.prisma.demandActual.findMany({
			where: {
				skuSettingId: { in: skuSettingIds },
				...(channels?.length ? { channel: { in: channels } } : {}),
				...(from || to ? { period } : {}),
			},
			orderBy: [{ skuSettingId: 'asc' }, { channel: 'asc' }, { period: 'asc' }],
		});
	}
}
