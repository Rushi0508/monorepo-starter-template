import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { FulfillmentStatusEnum, PaymentStatusEnum } from '@repo/enums';
import type {
	CustomerSplit,
	DashboardDailyPoint,
	DashboardMetrics,
	DashboardOrderStatusItem,
	DashboardTopSku,
	GetDashboardResponseType,
	SessionsBreakdownRow,
} from '@repo/types';
import {
	applyChannelFilter,
	calculateGrossRevenue,
	calculateNetRevenue,
	calculateTotalRefunds,
	endOfDayInTimeZone,
	endOfUtcDay,
	formatDayKeyInTimeZone,
	startOfDayInTimeZone,
	startOfUtcDay,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;

const ORDER_STATUS_CONFIG: DashboardOrderStatusItem[] = [
	{
		key: 'paid_unfulfilled',
		label: 'Paid · Unfulfilled',
		count: 0,
		color: '#F59E0B',
	},
	{ key: 'in_transit', label: 'In transit', count: 0, color: '#3B82F6' },
	{ key: 'delivered', label: 'Delivered', count: 0, color: '#22C55E' },
	{ key: 'refunded', label: 'Refunded', count: 0, color: '#EF4444' },
	{ key: 'cancelled', label: 'Cancelled', count: 0, color: '#D1D5DB' },
];

const IN_TRANSIT_STATUSES: string[] = [
	FulfillmentStatusEnum.PARTIALLY_FULFILLED,
	FulfillmentStatusEnum.IN_PROGRESS,
];

const REFUNDED_PAYMENT_STATUSES: string[] = [
	PaymentStatusEnum.REFUNDED,
	PaymentStatusEnum.PARTIALLY_REFUNDED,
];

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	async getDashboard(
		query: DashboardQueryDto,
		timeZone: string
	): Promise<GetDashboardResponseType> {
		const { dateStart, dateEnd, channels } = query;
		const now = new Date();

		// ── 1. Parse date range ───────────────────────────────────────────────────
		// Leaving bounds undefined → Prisma omits the WHERE clause → all-time data
		// "YYYY-MM-DD" is the user's calendar day — resolve it in their timezone
		const from = dateStart
			? startOfDayInTimeZone(dateStart, timeZone)
			: undefined;
		const to = dateEnd ? endOfDayInTimeZone(dateEnd, timeZone) : undefined;

		// Prior period for trend (same duration before range start)
		const rangeMs = from && to ? to.getTime() - from.getTime() : undefined;
		const priorFrom =
			from && rangeMs !== undefined
				? new Date(from.getTime() - rangeMs - 1)
				: undefined;
		const priorTo = from ? new Date(from.getTime() - 1) : undefined;

		// Build current period where clause
		const currentWhere: Prisma.ShopifyOrderWhereInput =
			from || to
				? {
						shopifyCreatedAt: {
							...(from && { gte: from }),
							...(to && { lte: to }),
						},
					}
				: {};

		if (channels) {
			applyChannelFilter(currentWhere, channels);
		}

		// Build prior period where clause
		const priorWhere: Prisma.ShopifyOrderWhereInput =
			priorFrom && priorTo
				? {
						shopifyCreatedAt: {
							gte: priorFrom,
							lte: priorTo,
						},
					}
				: {};

		if (channels) {
			applyChannelFilter(priorWhere, channels);
		}

		// Session rollups key on a calendar day stored at UTC midnight, not on a
		// real instant — match them on the day itself, not the viewer's offset
		const analyticsFrom = dateStart ? startOfUtcDay(dateStart) : undefined;
		const analyticsTo = dateEnd ? endOfUtcDay(dateEnd) : undefined;

		const analyticsDateFilter = {
			...(analyticsFrom && { gte: analyticsFrom }),
			...(analyticsTo && { lte: analyticsTo }),
		};

		const analyticsWhere: Prisma.ShopifySessionsDailyWhereInput =
			analyticsFrom || analyticsTo ? { date: analyticsDateFilter } : {};

		const sessionChannelDeviceWhere: Prisma.ShopifySessionsChannelDeviceDailyWhereInput =
			analyticsFrom || analyticsTo ? { date: analyticsDateFilter } : {};

		// ── 3. Fetch in parallel ──────────────────────────────────────────────────
		const currentOrdersPromise = this.prisma.shopifyOrder.findMany({
			where: currentWhere,
			select: {
				customerId: true,
				totalDiscounts: true,
				totalShippingPrice: true,
				financialStatus: true,
				fulfillmentStatus: true,
				cancelledAt: true,
				shopifyCreatedAt: true,
				lineItems: {
					select: {
						sku: true,
						title: true,
						currentQuantity: true,
						quantity: true,
						price: true,
						totalDiscount: true,
					},
				},
				refunds: {
					select: {
						lineItems: { select: { totalTax: true } },
						transactions: {
							select: { amount: true, status: true },
						},
					},
				},
			},
		});

		const priorOrdersPromise =
			priorFrom && priorTo
				? this.prisma.shopifyOrder.findMany({
						where: priorWhere,
						select: {
							customerId: true,
							totalDiscounts: true,
							totalShippingPrice: true,
							financialStatus: true,
							fulfillmentStatus: true,
							cancelledAt: true,
							shopifyCreatedAt: true,
							lineItems: {
								select: {
									sku: true,
									title: true,
									currentQuantity: true,
									quantity: true,
									price: true,
									totalDiscount: true,
								},
							},
							refunds: {
								select: {
									lineItems: { select: { totalTax: true } },
									transactions: {
										select: { amount: true, status: true },
									},
								},
							},
						},
					})
				: Promise.resolve([] as Awaited<typeof currentOrdersPromise>);

		const [
			currentOrders,
			priorOrders,
			openAlertOrders,
			{ _sum },
			sessionBreakdownRaw,
			activeSubscriptions,
		] = await Promise.all([
			// All orders in range with full detail for charts
			currentOrdersPromise,
			// All orders in prior period
			priorOrdersPromise,

			// Open alerts: PAID + UNFULFILLED overdue by 2–30 days (absolute window)
			this.prisma.shopifyOrder.count({
				where: {
					cancelledAt: null,
					financialStatus: PaymentStatusEnum.PAID,
					OR: [
						{ fulfillmentStatus: FulfillmentStatusEnum.UNFULFILLED },
						{ fulfillmentStatus: null },
					],
					shopifyCreatedAt: {
						lte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
						gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
					},
				},
			}),

			await this.prisma.shopifySessionsDaily.aggregate({
				_sum: { sessions: true, completedCheckouts: true },
				where: analyticsWhere,
			}),

			// Channel × device breakdown for the selected date range
			this.prisma.shopifySessionsChannelDeviceDaily.groupBy({
				by: ['referringChannel', 'deviceType'],
				_sum: { sessions: true, completedCheckouts: true },
				where: sessionChannelDeviceWhere,
				orderBy: { _sum: { sessions: 'desc' } },
			}),

			this.prisma.shopifySubscription.count({
				where: {
					status: 'ACTIVE',
				},
			}),
		]);

		// ── 4. Split cancelled / non-cancelled ────────────────────────────────────
		const nonCancelledOrders = currentOrders.filter((o) => !o.cancelledAt);
		const priorNonCancelledOrders = priorOrders.filter((o) => !o.cancelledAt);

		// ── 5. Metrics ────────────────────────────────────────────────────────────
		const grossRevenue = calculateGrossRevenue({
			shipping: nonCancelledOrders.reduce(
				(s, o) => s + (o.totalShippingPrice ?? 0),
				0
			),
			lineItems: nonCancelledOrders.flatMap((o) =>
				o.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				}))
			),
		});
		const totalDiscounts = nonCancelledOrders.reduce(
			(s, o) => s + (o.totalDiscounts ?? 0),
			0
		);
		const totalRefunds = calculateTotalRefunds({
			refunds: nonCancelledOrders.flatMap((o) => o.refunds),
		});
		const netRevenue = calculateNetRevenue({
			grossRevenue,
			totalDiscounts,
			totalRefunds,
		});

		const priorGrossRevenue = calculateGrossRevenue({
			shipping: priorNonCancelledOrders.reduce(
				(s, o) => s + (o.totalShippingPrice ?? 0),
				0
			),
			lineItems: priorNonCancelledOrders.flatMap((o) =>
				o.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				}))
			),
		});
		const priorTotalDiscounts = priorNonCancelledOrders.reduce(
			(s, o) => s + (o.totalDiscounts ?? 0),
			0
		);
		const priorTotalRefunds = calculateTotalRefunds({
			refunds: priorNonCancelledOrders.flatMap((o) => o.refunds),
		});
		const priorNetRevenue = calculateNetRevenue({
			grossRevenue: priorGrossRevenue,
			totalDiscounts: priorTotalDiscounts,
			totalRefunds: priorTotalRefunds,
		});

		const netRevenueTrendPercentage =
			priorNetRevenue > 0
				? +(((netRevenue - priorNetRevenue) / priorNetRevenue) * 100).toFixed(1)
				: 0;

		const unitsShipped = nonCancelledOrders
			.filter((o) => o.fulfillmentStatus === FulfillmentStatusEnum.FULFILLED)
			.reduce(
				(s, o) => s + o.lineItems.reduce((ls, li) => ls + li.quantity, 0),
				0
			);

		const metrics: DashboardMetrics = {
			orders: currentOrders.length,
			netRevenue: Math.round(netRevenue),
			netRevenueTrendPercentage,
			unitsShipped,
			openAlerts: openAlertOrders,
			conversionRate: _sum.sessions
				? Number(
						(((_sum.completedCheckouts ?? 0) / _sum.sessions) * 100).toFixed(2)
					)
				: 0,
			alertDetail:
				openAlertOrders > 0
					? `${openAlertOrders} order${openAlertOrders > 1 ? 's' : ''} paid but not fulfilled for 2+ days`
					: 'No overdue orders',
			repeatPurchaseRate: 0,
			avgTimeBetweenOrders: 0,
			activeSubscriptions,
		};

		// ── 6. Order status breakdown ─────────────────────────────────────────────
		const counts: Record<string, number> = {
			paid_unfulfilled: 0,
			in_transit: 0,
			delivered: 0,
			refunded: 0,
			cancelled: 0,
		};

		for (const o of currentOrders) {
			if (o.cancelledAt) {
				counts.cancelled++;
			} else if (REFUNDED_PAYMENT_STATUSES.includes(o.financialStatus ?? '')) {
				counts.refunded++;
			} else if (o.fulfillmentStatus === FulfillmentStatusEnum.FULFILLED) {
				counts.delivered++;
			} else if (IN_TRANSIT_STATUSES.includes(o.fulfillmentStatus ?? '')) {
				counts.in_transit++;
			} else {
				counts.paid_unfulfilled++;
			}
		}

		const orderStatus: DashboardOrderStatusItem[] = ORDER_STATUS_CONFIG.map(
			(cfg) => ({ ...cfg, count: counts[cfg.key] ?? 0 })
		);

		// ── 7. Daily trend (gross revenue, net revenue, order count, AOV) ───────────
		const dailyMap = new Map<
			string,
			{
				grossRevenue: number;
				netRevenue: number;
				orders: number;
			}
		>();

		for (const o of nonCancelledOrders) {
			if (!o.shopifyCreatedAt) continue;

			const date = formatDayKeyInTimeZone(o.shopifyCreatedAt, timeZone);

			const grossRevenue = calculateGrossRevenue({
				shipping: o.totalShippingPrice,
				lineItems: o.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				})),
			});

			const totalDiscounts = o.totalDiscounts ?? 0;

			const totalRefunds = calculateTotalRefunds({
				refunds: o.refunds,
			});

			const netRevenue = calculateNetRevenue({
				grossRevenue,
				totalDiscounts,
				totalRefunds,
			});

			const existing = dailyMap.get(date) ?? {
				grossRevenue: 0,
				netRevenue: 0,
				orders: 0,
			};

			existing.grossRevenue += grossRevenue;
			existing.netRevenue += netRevenue;
			existing.orders += 1;

			dailyMap.set(date, existing);
		}

		const dailyTrend: DashboardDailyPoint[] = [...dailyMap.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, { grossRevenue, netRevenue, orders }]) => ({
				date,
				grossRevenue: r2(grossRevenue),
				netRevenue: r2(netRevenue),
				orders,
				grossAov: orders > 0 ? r2(grossRevenue / orders) : 0,
				netAov: orders > 0 ? r2(netRevenue / orders) : 0,
			}));

		// ── 8. Top 5 SKUs by net revenue ─────────────────────────────────────────
		const skuMap = new Map<
			string,
			{
				title: string | null;
				grossRevenue: number;
				netRevenue: number;
				units: number;
			}
		>();

		const catalog = await loadSkuCatalog(this.prisma);
		for (const o of nonCancelledOrders) {
			for (const li of o.lineItems) {
				if (!li.sku || li.currentQuantity === 0) continue;
				const sku = catalog.canonical(li.sku);

				const grossRevenue = (li.price ?? 0) * li.quantity;
				const netRevenue = grossRevenue - (li.totalDiscount ?? 0);

				const existing = skuMap.get(sku) ?? {
					title: li.title,
					grossRevenue: 0,
					netRevenue: 0,
					units: 0,
				};

				existing.grossRevenue += grossRevenue;
				existing.netRevenue += netRevenue;
				existing.units += li.quantity;

				skuMap.set(sku, existing);
			}
		}

		const topSkus: DashboardTopSku[] = [...skuMap.entries()]
			.map(([sku, { title, grossRevenue, netRevenue, units }]) => ({
				sku,
				title,
				grossRevenue: r2(grossRevenue),
				netRevenue: r2(netRevenue),
				units,
			}))
			.sort((a, b) => b.netRevenue - a.netRevenue)
			.slice(0, 5);

		const sessionBreakdown: SessionsBreakdownRow[] = sessionBreakdownRaw.map(
			(row) => ({
				referringChannel: row.referringChannel,
				deviceType: row.deviceType,
				sessions: row._sum.sessions ?? 0,
				completedCheckouts: row._sum.completedCheckouts ?? 0,
			})
		);

		// ── New vs returning customers ────────────────────────────────────────────
		// new = 1 order in range; returning = 2+ orders in range
		const customerOrderCounts = new Map<string, number>();
		for (const o of nonCancelledOrders) {
			if (o.customerId) {
				customerOrderCounts.set(
					o.customerId,
					(customerOrderCounts.get(o.customerId) ?? 0) + 1
				);
			}
		}
		const customerSplit: CustomerSplit = {
			newCustomers: 0,
			returningCustomers: 0,
		};
		for (const count of customerOrderCounts.values()) {
			if (count === 1) customerSplit.newCustomers++;
			else customerSplit.returningCustomers++;
		}

		// ── Repeat purchase rate & retention metrics ──────────────────────
		const totalCustomers = customerOrderCounts.size;
		metrics.repeatPurchaseRate =
			totalCustomers > 0
				? r2((customerSplit.returningCustomers / totalCustomers) * 100)
				: 0;

		// Avg time between orders: for customers with 2+ orders, compute mean gap
		const customerDates = new Map<string, Date[]>();
		for (const o of nonCancelledOrders) {
			if (o.customerId && o.shopifyCreatedAt) {
				const dates = customerDates.get(o.customerId) ?? [];
				dates.push(o.shopifyCreatedAt);
				customerDates.set(o.customerId, dates);
			}
		}
		let totalGapDays = 0;
		let gapCount = 0;
		for (const dates of customerDates.values()) {
			if (dates.length < 2) continue;
			dates.sort((a, b) => a.getTime() - b.getTime());
			for (let i = 1; i < dates.length; i++) {
				totalGapDays +=
					(dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
				gapCount++;
			}
		}
		metrics.avgTimeBetweenOrders =
			gapCount > 0 ? r2(totalGapDays / gapCount) : 0;

		return {
			metrics,
			orderStatus,
			dailyTrend,
			topSkus,
			sessionBreakdown,
			customerSplit,
		};
	}
}
