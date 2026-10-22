import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { FulfillmentStatusEnum, PaymentStatusEnum } from '@repo/enums';
import type {
	GetOrdersResponseType,
	OrderFulfillment,
	OrderItem,
	OrderLineItem,
} from '@repo/types';
import {
	applyChannelFilter,
	calculateGrossRevenue,
	calculateNetRevenue,
	calculateTotalRefunds,
	endOfDayInTimeZone,
	getChannel,
	startOfDayInTimeZone,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import { SkuCostService, sumBlueboxShipping } from 'src/sku/sku-cost.service';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly skuCostService: SkuCostService
	) {}

	async getOrders(
		query: OrderQueryDto,
		timeZone: string
	): Promise<GetOrdersResponseType> {
		const {
			search,
			paymentStatus,
			fulfillmentStatus,
			skus,
			channels,
			orderDateStart,
			orderDateEnd,
			estimatedDeliveryStart,
			estimatedDeliveryEnd,
			deliveredAtStart,
			deliveredAtEnd,
			isCancelled,
			orderType,
			sortBy,
			sortOrder,
			page = 1,
			limit = 20,
		} = query;

		const where: Prisma.ShopifyOrderWhereInput = {};

		if (search) {
			const term = `%${search.replace(/[%_\\]/g, '\\$&')}%`; // escape LIKE wildcards

			const tagMatches = await this.prisma.$queryRaw<{ id: string }[]>`
				SELECT id
				FROM "shopify_orders"
				WHERE EXISTS (
					SELECT 1 FROM unnest(tags) AS tag
					WHERE tag ILIKE ${term}
				)
			`;

			where.OR = [
				{
					orderNumber: {
						equals: Number.isNaN(Number(search)) ? undefined : Number(search),
					},
				},
				{ orderName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ shipCompany: { contains: search, mode: 'insensitive' } },
				{
					customer: { displayName: { contains: search, mode: 'insensitive' } },
				},
				{ customer: { email: { contains: search, mode: 'insensitive' } } },
				...(tagMatches.length > 0
					? [{ id: { in: tagMatches.map((t) => t.id) } }]
					: []),
			];
		}

		if (paymentStatus?.length) {
			where.financialStatus = { in: paymentStatus };
		}

		if (fulfillmentStatus?.length) {
			where.fulfillmentStatus = { in: fulfillmentStatus };
		}

		if (skus?.length) {
			const catalog = await loadSkuCatalog(this.prisma);
			where.lineItems = { some: { sku: { in: catalog.expand(skus) } } };
		}

		if (channels) {
			applyChannelFilter(where, channels);
		}

		if (orderDateStart || orderDateEnd) {
			where.shopifyCreatedAt = {};
			if (orderDateStart) {
				where.shopifyCreatedAt.gte = startOfDayInTimeZone(
					orderDateStart,
					timeZone
				);
			}
			if (orderDateEnd) {
				where.shopifyCreatedAt.lte = endOfDayInTimeZone(orderDateEnd, timeZone);
			}
		}

		if (isCancelled === true) {
			where.cancelledAt = { not: null };
		} else if (isCancelled === false) {
			where.cancelledAt = null;
		}

		if (orderType === 'normal') {
			where.isBundleOrder = false;
			where.isSubscriptionOrder = false;
		} else if (orderType === 'bundle') {
			where.isBundleOrder = true;
		} else if (orderType === 'subscription') {
			where.isSubscriptionOrder = true;
		}
		if (estimatedDeliveryStart || estimatedDeliveryEnd) {
			const estFrom = estimatedDeliveryStart
				? startOfDayInTimeZone(estimatedDeliveryStart, timeZone)
				: undefined;
			const estTo = estimatedDeliveryEnd
				? endOfDayInTimeZone(estimatedDeliveryEnd, timeZone)
				: undefined;
			where.fulfillments = {
				some: {
					estimatedDeliveryAt: {
						...(estFrom && { gte: estFrom }),
						...(estTo && { lte: estTo }),
					},
				},
			};
		}

		if (deliveredAtStart || deliveredAtEnd) {
			const delFrom = deliveredAtStart
				? startOfDayInTimeZone(deliveredAtStart, timeZone)
				: undefined;
			const delTo = deliveredAtEnd
				? endOfDayInTimeZone(deliveredAtEnd, timeZone)
				: undefined;
			where.fulfillments = {
				...where.fulfillments,
				some: {
					...(where.fulfillments as any)?.some,
					deliveredAt: {
						...(delFrom && { gte: delFrom }),
						...(delTo && { lte: delTo }),
					},
				},
			};
		}

		const include = {
			customer: {
				select: { displayName: true, email: true },
			},
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
					id: true,
					sku: true,
					title: true,
					variantTitle: true,
					quantity: true,
					currentQuantity: true,
					price: true,
					totalDiscount: true,
					discountAllocations: true,
					fulfillmentStatus: true,
				},
			},
			fulfillments: {
				select: {
					id: true,
					shopifyId: true,
					status: true,
					shipmentStatus: true,
					trackingCompany: true,
					trackingNumber: true,
					trackingNumbers: true,
					trackingUrl: true,
					trackingUrls: true,
					estimatedDeliveryAt: true,
					deliveredAt: true,
					inTransitAt: true,
					createdAt: true,
				},
				orderBy: { shopifyCreatedAt: 'asc' as const },
			},
			emailFlow: true,
		};

		let totalCount: number;
		let orders: Prisma.ShopifyOrderGetPayload<{ include: typeof include }>[];

		if (sortBy === 'netRevenue') {
			// Computed field — rank with a light select, then hydrate the page
			const scored = await this.prisma.shopifyOrder.findMany({
				where,
				select: {
					id: true,
					totalDiscounts: true,
					totalShippingPrice: true,
					lineItems: { select: { quantity: true, price: true } },
					refunds: {
						select: {
							lineItems: { select: { totalTax: true } },
							transactions: { select: { amount: true, status: true } },
						},
					},
				},
			});

			const direction = sortOrder === 'asc' ? 1 : -1;
			const pageIds = scored
				.map((o) => ({
					id: o.id,
					net: calculateNetRevenue({
						grossRevenue: calculateGrossRevenue({
							shipping: o.totalShippingPrice,
							lineItems: o.lineItems.map((li) => ({
								quantity: li.quantity,
								price: li.price ?? 0,
							})),
						}),
						totalDiscounts: o.totalDiscounts ?? 0,
						totalRefunds: calculateTotalRefunds({ refunds: o.refunds }),
					}),
				}))
				.sort((a, b) => (a.net - b.net) * direction)
				.slice((page - 1) * limit, page * limit)
				.map((r) => r.id);

			totalCount = scored.length;
			const pageOrders = pageIds.length
				? await this.prisma.shopifyOrder.findMany({
						where: { id: { in: pageIds } },
						include,
					})
				: [];
			const byId = new Map(pageOrders.map((o) => [o.id, o]));
			orders = pageIds.map((id) => byId.get(id)).filter((o) => o != null);
		} else {
			[totalCount, orders] = await Promise.all([
				this.prisma.shopifyOrder.count({ where }),
				this.prisma.shopifyOrder.findMany({
					where,
					orderBy: { shopifyCreatedAt: sortOrder ?? 'desc' },
					skip: (page - 1) * limit,
					take: limit,
					include,
				}),
			]);
		}

		const shopifyIds = orders.map((o) => o.shopifyId);
		const blueboxOrders = shopifyIds.length
			? await this.prisma.blueboxOrder.findMany({
					where: { externalId: { in: shopifyIds } },
					select: {
						externalId: true,
						blueboxId: true,
						workflowStatus: true,
						shippingCost: true,
						dateOrderPicked: true,
						dateOrderShipped: true,
						dateOrderDelivered: true,
					},
				})
			: [];
		const costs = await this.skuCostService.loadLookup(
			orders.flatMap((o) => o.lineItems.map((li) => li.sku))
		);
		const blueboxByShopifyId = new Map(
			blueboxOrders.map((bb) => [bb.externalId, bb])
		);

		const blueboxShippingByShopifyId = sumBlueboxShipping(blueboxOrders);

		const data: OrderItem[] = orders.map((order) => {
			const skuList = [
				...new Set(order.lineItems.map((li) => li.sku).filter(Boolean)),
			] as string[];

			const lineItems: OrderLineItem[] = order.lineItems.map((li) => ({
				id: li.id,
				sku: li.sku,
				title: li.title,
				variantTitle: li.variantTitle,
				quantity: li.quantity,
				currentQuantity: li.currentQuantity,
				price: li.price,
				discountAllocations: li.discountAllocations as any,
				totalDiscount: li.totalDiscount,
				fulfillmentStatus: li.fulfillmentStatus,
			}));

			const grossRevenue = calculateGrossRevenue({
				shipping: order.totalShippingPrice,
				lineItems: lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				})),
			});

			const totalDiscounts = order.totalDiscounts ?? 0;
			const totalRefunds = calculateTotalRefunds({
				refunds: order.refunds,
			});
			const netRevenue = calculateNetRevenue({
				grossRevenue,
				totalDiscounts,
				totalRefunds,
			});

			const bluebox = blueboxByShopifyId.get(order.shopifyId);
			const channel = getChannel({
				tags: order.tags,
				appName: order.appName,
			});

			return {
				id: order.id,
				shopifyId: order.shopifyId,
				blueboxId: bluebox?.blueboxId ?? null,
				blueboxWorkflowStatus: bluebox?.workflowStatus ?? null,
				orderNumber: order.orderNumber,
				orderName: order.orderName ?? null,
				date: order.shopifyCreatedAt?.toISOString() ?? null,
				cancelledAt: order.cancelledAt?.toISOString() ?? null,
				note: order.note ?? null,
				customerId: order.customerId ?? null,
				customerDisplayName: order.customer?.displayName ?? null,
				customerEmail: order.customer?.email ?? order.email ?? null,
				skus: skuList.join(', '),
				netRevenue,
				totalPrice: order.totalPrice,
				subtotalPrice: order.subtotalPrice,
				totalDiscounts: order.totalDiscounts,
				totalShippingPrice: order.totalShippingPrice,
				totalTax: order.totalTax,
				currency: order.currency,
				paymentStatus: (order.financialStatus as PaymentStatusEnum) ?? null,
				fulfillmentStatus:
					(order.fulfillmentStatus as FulfillmentStatusEnum) ?? null,
				paymentGatewayNames: order.paymentGatewayNames,
				channel,
				tags: order.tags,
				shipName: order.shipName,
				shipCompany: order.shipCompany,
				shipAddress1: order.shipAddress1,
				shipAddress2: order.shipAddress2,
				shipCity: order.shipCity,
				shipProvinceCode: order.shipProvinceCode,
				shipZip: order.shipZip,
				shipCountryCode: order.shipCountryCode,
				shipPhone: order.shipPhone,
				dateOrderPicked: bluebox?.dateOrderPicked?.toISOString() ?? null,
				dateOrderShipped: bluebox?.dateOrderShipped?.toISOString() ?? null,
				dateOrderDelivered: bluebox?.dateOrderDelivered?.toISOString() ?? null,
				estimatedDeliveryAt:
					order.fulfillments
						.map((f) => f.estimatedDeliveryAt)
						.filter((d): d is Date => d !== null)
						.sort((a, b) => b.getTime() - a.getTime())[0]
						?.toISOString() ?? null,
				blueboxShippingCost: bluebox?.shippingCost ?? null,
				emailFlow: order.emailFlow ?? null,
				// Cancelled orders are left out of revenue, so they carry no margin
				...(!order.cancelledAt && {
					margin: this.skuCostService.calculateOrderMargin({
						lineItems,
						orderDate: order.shopifyCreatedAt,
						channel,
						grossRevenue,
						totalDiscounts,
						totalRefunds,
						netRevenue,
						blueboxShippingCost:
							blueboxShippingByShopifyId.get(order.shopifyId) ?? null,
						costs,
						timeZone,
					}),
				}),
				lineItems,
				fulfillments: order.fulfillments.map(
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
			};
		});

		return { data, totalCount, page, limit };
	}
}
