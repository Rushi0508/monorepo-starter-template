import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { ChannelEnum } from '@repo/enums';
import type {
	FulfillmentMetrics,
	FulfillmentOrderItem,
	GetFulfillmentResponseType,
	OrderFulfillment,
} from '@repo/types';
import {
	applyChannelFilter,
	calculateGrossRevenue,
	calculateNetRevenue,
	calculateTotalRefunds,
	endOfDayInTimeZone,
	getChannel,
	isB2B,
	startOfDayInTimeZone,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { SkuCostService, sumBlueboxShipping } from 'src/sku/sku-cost.service';
import { FulfillmentQueryDto } from './dto/fulfillment-query.dto';

// Fallback thresholds when no Configuration row exists
const DEFAULT_D2C_MAX_TRANSIT_DAYS = 7;
const DEFAULT_B2B_MAX_TRANSIT_DAYS = 7;

@Injectable()
export class FulfillmentService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly skuCostService: SkuCostService
	) {}

	async getFulfillment(
		query: FulfillmentQueryDto,
		timeZone: string
	): Promise<GetFulfillmentResponseType> {
		const {
			search,
			orderDateStart,
			orderDateEnd,
			channels,
			fulfillmentStatus,
			sortBy,
			sortOrder,
			page = 1,
			limit = 20,
		} = query;

		const from = orderDateStart
			? startOfDayInTimeZone(orderDateStart, timeZone)
			: undefined;
		const to = orderDateEnd
			? endOfDayInTimeZone(orderDateEnd, timeZone)
			: undefined;

		const shopifyWhere: Prisma.ShopifyOrderWhereInput = {
			shopifyCreatedAt: {
				...(from && { gte: from }),
				...(to && { lte: to }),
			},
		};

		if (channels) {
			applyChannelFilter(shopifyWhere, channels);
		}

		if (fulfillmentStatus?.length) {
			shopifyWhere.fulfillmentStatus = { in: fulfillmentStatus };
		}

		if (search) {
			shopifyWhere.OR = [
				{
					orderNumber: {
						equals: Number.isNaN(Number(search)) ? undefined : Number(search),
					},
				},
				{ orderName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{
					customer: { displayName: { contains: search, mode: 'insensitive' } },
				},
				{ customer: { email: { contains: search, mode: 'insensitive' } } },
			];
		}

		// ── 1. Fetch Shopify orders + Configuration in parallel ────────────────────
		const [shopifyOrders, configuration] = await Promise.all([
			this.prisma.shopifyOrder.findMany({
				where: shopifyWhere,
				include: {
					customer: { select: { displayName: true, email: true } },
					lineItems: true,
					refunds: {
						select: {
							lineItems: { select: { totalTax: true } },
							transactions: { select: { amount: true, status: true } },
						},
					},
					fulfillments: {
						orderBy: { shopifyCreatedAt: 'asc' },
					},
				},
				orderBy: { shopifyCreatedAt: 'desc' },
			}),
			this.prisma.configuration.findFirst(),
		]);

		const d2cMaxTransitDays =
			configuration?.d2cMaxTransitDays ?? DEFAULT_D2C_MAX_TRANSIT_DAYS;
		const b2bMaxTransitDays =
			configuration?.b2bMaxTransitDays ?? DEFAULT_B2B_MAX_TRANSIT_DAYS;

		// ── 2. Look up Bluebox orders by externalId (= shopifyId) ──────────────────
		const shopifyIds = shopifyOrders.map((o) => o.shopifyId);

		const blueboxOrders = shopifyIds.length
			? await this.prisma.blueboxOrder.findMany({
					where: { externalId: { in: shopifyIds } },
				})
			: [];

		const blueboxByShopifyId = new Map(
			blueboxOrders.map((bb) => [bb.externalId, bb])
		);
		const blueboxShippingByShopifyId = sumBlueboxShipping(blueboxOrders);
		const costs = await this.skuCostService.loadLookup(
			shopifyOrders.flatMap((o) => o.lineItems.map((li) => li.sku))
		);

		// ── 3. Build order items (OrderItem shape + Bluebox fields) ──────────────────
		const orders: FulfillmentOrderItem[] = shopifyOrders.map((shopify) => {
			const bb = blueboxByShopifyId.get(shopify.shopifyId) ?? null;
			const channel = getChannel({
				tags: shopify.tags,
				appName: shopify.appName,
			});

			// Transit time from Bluebox: dateOrderShipped → dateOrderDelivered
			const transitDays =
				bb?.dateOrderShipped && bb?.dateOrderDelivered
					? Math.round(
							(bb.dateOrderDelivered.getTime() -
								bb.dateOrderShipped.getTime()) /
								(1000 * 60 * 60 * 24)
						)
					: null;

			// Lead time: shopify order created → Bluebox delivered
			const leadDays =
				shopify.shopifyCreatedAt && bb?.dateOrderDelivered
					? Math.round(
							(bb.dateOrderDelivered.getTime() -
								shopify.shopifyCreatedAt.getTime()) /
								(1000 * 60 * 60 * 24)
						)
					: null;

			const uniqueSkus = [
				...new Set(
					shopify.lineItems
						.map((li) => li.sku)
						.filter((s): s is string => Boolean(s))
				),
			];

			const grossRevenue = calculateGrossRevenue({
				shipping: shopify.totalShippingPrice,
				lineItems: shopify.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				})),
			});

			const totalDiscounts = shopify.totalDiscounts ?? 0;
			const totalRefunds = calculateTotalRefunds({
				refunds: shopify.refunds,
			});

			const netRevenue = calculateNetRevenue({
				grossRevenue,
				totalDiscounts,
				totalRefunds,
			});

			return {
				// ── OrderItem fields ──
				id: shopify.id,
				shopifyId: shopify.shopifyId,
				orderNumber: shopify.orderNumber,
				orderName: shopify.orderName ?? null,
				date: shopify.shopifyCreatedAt?.toISOString() ?? null,
				cancelledAt: shopify.cancelledAt?.toISOString() ?? null,
				customerDisplayName: shopify.customer?.displayName ?? null,
				customerEmail: shopify.customer?.email ?? null,
				skus: uniqueSkus.join(', '),
				netRevenue,
				totalPrice: shopify.totalPrice ?? null,
				subtotalPrice: shopify.subtotalPrice ?? null,
				totalDiscounts: shopify.totalDiscounts ?? null,
				totalShippingPrice: shopify.totalShippingPrice ?? null,
				totalTax: shopify.totalTax ?? null,
				currency: shopify.currency ?? null,
				paymentStatus: shopify.financialStatus ?? null,
				fulfillmentStatus: shopify.fulfillmentStatus ?? null,
				paymentGatewayNames: shopify.paymentGatewayNames,
				channel,
				tags: shopify.tags,
				customerId: shopify.customerId ?? null,
				note: shopify.note ?? null,
				shipName: shopify.shipName ?? null,
				shipCompany: shopify.shipCompany ?? null,
				shipAddress1: shopify.shipAddress1 ?? null,
				shipAddress2: shopify.shipAddress2 ?? null,
				shipCity: shopify.shipCity ?? null,
				shipProvinceCode: shopify.shipProvinceCode ?? null,
				shipZip: shopify.shipZip ?? null,
				shipCountryCode: shopify.shipCountryCode ?? null,
				shipPhone: shopify.shipPhone ?? null,
				lineItems: shopify.lineItems.map((li) => ({
					id: li.id,
					sku: li.sku ?? null,
					title: li.title ?? null,
					variantTitle: li.variantTitle ?? null,
					quantity: li.quantity ?? 0,
					currentQuantity: li.currentQuantity ?? 0,
					price: li.price ?? null,
					totalDiscount: li.totalDiscount ?? null,
					discountAllocations: li.discountAllocations as any,
					fulfillmentStatus: li.fulfillmentStatus ?? null,
				})),
				fulfillments: shopify.fulfillments.map(
					(f): OrderFulfillment => ({
						id: f.id,
						shopifyId: f.shopifyId,
						status: f.status ?? null,
						shipmentStatus: f.shipmentStatus ?? null,
						trackingCompany: f.trackingCompany ?? null,
						trackingNumber: f.trackingNumber ?? null,
						trackingNumbers: f.trackingNumbers,
						trackingUrl: f.trackingUrl ?? null,
						trackingUrls: f.trackingUrls,
						estimatedDeliveryAt: f.estimatedDeliveryAt?.toISOString() ?? null,
						deliveredAt: f.deliveredAt?.toISOString() ?? null,
						inTransitAt: f.inTransitAt?.toISOString() ?? null,
						createdAt: f.createdAt.toISOString(),
					})
				),
				blueboxId: bb?.blueboxId ?? null,
				blueboxWorkflowStatus: bb?.workflowStatus ?? null,
				dateOrderPicked: bb?.dateOrderPicked?.toISOString() ?? null,
				dateOrderShipped: bb?.dateOrderShipped?.toISOString() ?? null,
				dateOrderDelivered: bb?.dateOrderDelivered?.toISOString() ?? null,
				estimatedDeliveryAt:
					shopify.fulfillments
						.map((f) => f.estimatedDeliveryAt)
						.filter((d): d is Date => d !== null)
						.sort((a, b) => b.getTime() - a.getTime())[0]
						?.toISOString() ?? null,
				blueboxShippingCost: bb?.shippingCost ?? null,
				transitDays,
				leadDays,
				// Cancelled orders are left out of revenue, so they carry no margin
				...(!shopify.cancelledAt && {
					margin: this.skuCostService.calculateOrderMargin({
						lineItems: shopify.lineItems,
						orderDate: shopify.shopifyCreatedAt,
						channel,
						grossRevenue: grossRevenue,
						totalDiscounts: totalDiscounts,
						totalRefunds: totalRefunds,
						netRevenue: netRevenue,
						blueboxShippingCost:
							blueboxShippingByShopifyId.get(shopify.shopifyId) ?? null,
						costs,
						timeZone,
					}),
				}),
			};
		});

		// ── 4. Compute metrics ──────────────────────────────────────────────────────
		// Delivered: orders where Bluebox has a delivery timestamp
		const delivered = orders.filter((o) => o.dateOrderDelivered !== null);

		const transitTimes = delivered
			.map((o) => o.transitDays)
			.filter((t): t is number => t !== null);

		const avgTransitTime = transitTimes.length
			? Math.round(
					(transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length) * 10
				) / 10
			: 0;

		const leadTimes = delivered
			.map((o) => o.leadDays)
			.filter((t): t is number => t !== null);

		const avgLeadTime = leadTimes.length
			? Math.round(
					(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 10
				) / 10
			: 0;

		// On-time = delivered within channel-specific max transit days (Bluebox transit)
		const onTimeCount = delivered.filter((o) => {
			if (o.transitDays === null) return false;
			const threshold = isB2B(o.channel as ChannelEnum)
				? b2bMaxTransitDays
				: d2cMaxTransitDays;
			return o.transitDays <= threshold;
		}).length;
		const onTimeRate =
			delivered.length > 0
				? Math.round((onTimeCount / delivered.length) * 100)
				: 0;

		const metrics: FulfillmentMetrics = {
			avgLeadTime,
			avgTransitTime,
			onTimeRate,
			d2cMaxTransitDays,
			b2bMaxTransitDays,
		};

		// ── 5. Sort + Paginate ──────────────────────────────────────────────────────
		if (sortBy) {
			const dir = sortOrder === 'asc' ? 1 : -1;
			orders.sort((a, b) => {
				// For delivery column, use effective date: actual delivery ?? estimated
				const va =
					sortBy === 'dateOrderDelivered'
						? (a.dateOrderDelivered ?? a.estimatedDeliveryAt)
						: a[sortBy];
				const vb =
					sortBy === 'dateOrderDelivered'
						? (b.dateOrderDelivered ?? b.estimatedDeliveryAt)
						: b[sortBy];
				if (va == null && vb == null) return 0;
				if (va == null) return 1;
				if (vb == null) return -1;
				if (typeof va === 'number' && typeof vb === 'number')
					return (va - vb) * dir;
				return String(va).localeCompare(String(vb)) * dir;
			});
		}

		const totalCount = orders.length;
		const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

		return { metrics, data: paginatedOrders, totalCount, page, limit };
	}
}
