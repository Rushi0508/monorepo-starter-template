import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@repo/db';
import {
	ChannelEnum,
	FulfillmentStatusEnum,
	PaymentStatusEnum,
} from '@repo/enums';
import type {
	GetCustomerDetailResponseType,
	GetCustomersResponseType,
	OrderFulfillment,
	OrderItem,
	OrderLineItem,
	SkuVelocityItem,
	UpdateCustomerInput,
} from '@repo/types';
import {
	anyChannelOrderWhere,
	calculateCogs,
	calculateGrossRevenue,
	calculateNetRevenue,
	calculateTotalRefunds,
	endOfDayInTimeZone,
	formatDayKeyInTimeZone,
	getChannel,
	isB2B,
	startOfDayInTimeZone,
} from '@repo/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';
import {
	type SkuCostLookup,
	SkuCostService,
	sumBlueboxShipping,
} from 'src/sku/sku-cost.service';
import { CustomerFilterQueryDto } from '../dto/customer-query.dto';
import { velocityWeeks } from '../sku-velocity';

const roundRate = (value: number | null) =>
	value == null ? null : Math.round(value * 100) / 100;

const resolveCompany = (customer: {
	displayName: string | null;
	addresses: { company: string | null }[];
}): string | null => {
	const company = customer.addresses
		.map((a) => a.company?.trim())
		.find(Boolean);
	if (!company) return null;
	return company.toLowerCase() === customer.displayName?.trim().toLowerCase()
		? null
		: company;
};

@Injectable()
export class CustomersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly skuCostService: SkuCostService
	) {}

	async getCustomers(
		filter: CustomerFilterQueryDto,
		timeZone: string
	): Promise<GetCustomersResponseType> {
		const {
			search,
			orderDateStart,
			orderDateEnd,
			minOrderCount,
			maxOrderCount,
			states,
			channels,
			sortBy,
			sortOrder,
			page = 1,
			limit = 10,
		} = filter;

		const where: Prisma.ShopifyCustomerWhereInput = {};

		if (search) {
			const term = `%${search.replace(/[%_\\]/g, '\\$&')}%`; // escape LIKE wildcards
			const tagMatches = await this.prisma.$queryRaw<{ id: string }[]>`
				SELECT id
				FROM "shopify_customers"
				WHERE EXISTS (
					SELECT 1 FROM unnest(tags) AS tag
					WHERE tag ILIKE ${term}
				)
			`;

			where.OR = [
				{ firstName: { contains: search, mode: 'insensitive' } },
				{ lastName: { contains: search, mode: 'insensitive' } },
				{ displayName: { contains: search, mode: 'insensitive' } },
				{ saueroCode: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ state: { contains: search, mode: 'insensitive' } },
				{
					addresses: {
						some: { city: { contains: search, mode: 'insensitive' } },
					},
				},
				{
					addresses: {
						some: { company: { contains: search, mode: 'insensitive' } },
					},
				},
				...(tagMatches.length > 0
					? [{ id: { in: tagMatches.map((t) => t.id) } }]
					: []),
			];
		}

		if (states && states.length > 0) {
			where.addresses = {
				some: { provinceCode: { in: states, mode: 'insensitive' } },
			};
		}

		const orderWhere: Prisma.ShopifyOrderWhereInput = {};
		if (orderDateStart || orderDateEnd) {
			orderWhere.shopifyCreatedAt = {};
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

		if (channels && channels.length > 0) {
			where.orders = {
				some: { AND: [orderWhere, anyChannelOrderWhere(channels)] },
			};
		} else if (Object.keys(orderWhere).length > 0) {
			where.orders = { some: orderWhere };
		}

		const customers = await this.prisma.shopifyCustomer.findMany({
			where,
			orderBy: { shopifyCreatedAt: 'desc' },
			include: {
				addresses: { orderBy: { isDefault: 'desc' } },
				orders: {
					where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
					select: {
						cancelledAt: true,
						totalPrice: true,
						totalDiscounts: true,
						totalShippingPrice: true,
						shopifyCreatedAt: true,
						lineItems: {
							select: {
								sku: true,
								price: true,
								quantity: true,
								currentQuantity: true,
								totalDiscount: true,
							},
						},
						refunds: {
							select: {
								lineItems: { select: { totalTax: true } },
								transactions: {
									select: {
										amount: true,
										status: true,
									},
								},
							},
						},
					},
				},
			},
		});

		const costs = await this.skuCostService.loadLookup(
			customers.flatMap((customer) =>
				customer.orders.flatMap((order) => order.lineItems.map((li) => li.sku))
			)
		);

		let data = customers.map((customer) => {
			const orders = customer.orders.filter((o) => !o.cancelledAt);

			const orderCountVal = orders.length;

			const grossRevenue = calculateGrossRevenue({
				shipping: orders.reduce(
					(sum, o) => sum + (o.totalShippingPrice ?? 0),
					0
				),
				lineItems: orders.flatMap((o) =>
					o.lineItems.map((li) => ({
						quantity: li.quantity,
						price: li.price ?? 0,
					}))
				),
			});
			const totalDiscounts = orders.reduce(
				(sum, o) => sum + (o.totalDiscounts ?? 0),
				0
			);
			const totalRefunds = calculateTotalRefunds({
				refunds: orders.flatMap((o) => o.refunds),
			});
			const netRevenue = calculateNetRevenue({
				grossRevenue,
				totalDiscounts,
				totalRefunds,
			});

			const caseVolume = orders.reduce(
				(sum, o) => sum + o.lineItems.reduce((ls, li) => ls + li.quantity, 0),
				0
			);
			const cogs = this.calculateCustomerCogs(orders, costs, timeZone);
			const grossProfit = netRevenue - cogs;
			const netAov = orderCountVal > 0 ? netRevenue / orderCountVal : 0;

			const defaultAddress =
				customer.addresses.find((a) => a.isDefault) ?? null;

			const lastOrderDate =
				orders.length > 0
					? (orders
							.map((o) => o.shopifyCreatedAt)
							.filter(Boolean)
							.sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0]
							?.toISOString() ?? '')
					: '';

			return {
				id: customer.id,
				name: [customer.firstName, customer.lastName].filter(Boolean).join(' '),
				email: customer.email ?? '',
				phone: customer.phone ?? '',
				displayName: customer.displayName ?? '',
				company: resolveCompany(customer),
				location: [defaultAddress?.city, defaultAddress?.provinceCode]
					.filter(Boolean)
					.join(', '),
				orderCount: orderCountVal,
				caseVolume,
				grossRevenue: Math.round(grossRevenue * 100) / 100,
				netRevenue: Math.round(netRevenue * 100) / 100,
				grossProfit: Math.round(grossProfit * 100) / 100,
				netAov: Math.round(netAov * 100) / 100,
				lastOrderDate,
				defaultAddress,
			};
		});

		if (minOrderCount != null && minOrderCount > 0) {
			data = data.filter((c) => c.orderCount >= minOrderCount);
		}

		if (maxOrderCount != null) {
			data = data.filter((c) => c.orderCount <= maxOrderCount);
		}

		if (sortBy) {
			const direction = sortOrder === 'asc' ? 1 : -1;
			data.sort((a, b) => {
				switch (sortBy) {
					case 'orders':
						return (a.orderCount - b.orderCount) * direction;
					case 'grossRevenue':
						return (a.grossRevenue - b.grossRevenue) * direction;
					case 'netRevenue':
						return (a.netRevenue - b.netRevenue) * direction;
					case 'grossProfit':
						return (a.grossProfit - b.grossProfit) * direction;
					case 'netAov':
						return (a.netAov - b.netAov) * direction;
					case 'lastOrderDate': {
						const aEmpty = !a.lastOrderDate;
						const bEmpty = !b.lastOrderDate;
						if (aEmpty && bEmpty) return 0;
						if (aEmpty) return 1;
						if (bEmpty) return -1;
						return a.lastOrderDate.localeCompare(b.lastOrderDate) * direction;
					}
					default:
						return 0;
				}
			});
		}

		const totalCount = data.length;
		const paginatedData = data.slice((page - 1) * limit, page * limit);

		return {
			data: paginatedData,
			totalCount,
			page,
			limit,
		};
	}

	async getCustomerDetail(
		id: string,
		timeZone?: string
	): Promise<GetCustomerDetailResponseType> {
		const customer = await this.prisma.shopifyCustomer.findUnique({
			where: { id },
			include: {
				folkCompanyMapping: true,
				addresses: { orderBy: { isDefault: 'desc' } },
				orders: {
					select: {
						id: true,
						shopifyId: true,
						orderNumber: true,
						orderName: true,
						cancelledAt: true,
						cancelReason: true,
						note: true,
						customerId: true,
						email: true,
						totalPrice: true,
						subtotalPrice: true,
						totalDiscounts: true,
						totalShippingPrice: true,
						totalTax: true,
						currency: true,
						financialStatus: true,
						fulfillmentStatus: true,
						paymentGatewayNames: true,
						tags: true,
						appName: true,
						shopifyCreatedAt: true,
						shipName: true,
						shipCompany: true,
						shipAddress1: true,
						shipAddress2: true,
						shipCity: true,
						shipProvinceCode: true,
						shipZip: true,
						shipCountryCode: true,
						shipPhone: true,
						lineItems: {
							select: {
								id: true,
								sku: true,
								title: true,
								variantTitle: true,
								price: true,
								quantity: true,
								currentQuantity: true,
								totalDiscount: true,
								discountAllocations: true,
								fulfillmentStatus: true,
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
						fulfillments: {
							orderBy: { shopifyCreatedAt: 'asc' },
						},
					},
					orderBy: { shopifyCreatedAt: 'desc' },
				},
			},
		});

		if (!customer) {
			throw new NotFoundException(`Customer with id "${id}" not found`);
		}

		const orders = customer.orders.filter((o) => !o.cancelledAt);
		const orderCount = orders.length;
		const costs = await this.skuCostService.loadLookup(
			orders.flatMap((order) => order.lineItems.map((li) => li.sku))
		);
		const grossRevenue = calculateGrossRevenue({
			shipping: orders.reduce((sum, o) => sum + (o.totalShippingPrice ?? 0), 0),
			lineItems: orders.flatMap((o) =>
				o.lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				}))
			),
		});
		const totalDiscounts = orders.reduce(
			(sum, o) => sum + (o.totalDiscounts ?? 0),
			0
		);
		const totalRefunds = calculateTotalRefunds({
			refunds: orders.flatMap((o) => o.refunds),
		});
		const netRevenue = calculateNetRevenue({
			grossRevenue,
			totalDiscounts,
			totalRefunds,
		});
		const cogs = this.calculateCustomerCogs(orders, costs, timeZone);
		const grossProfit = netRevenue - cogs;
		const netAov = orderCount > 0 ? netRevenue / orderCount : 0;

		const recentSkus = [
			...new Set(
				orders
					.flatMap((o) => o.lineItems)
					.map((li) => (li.title && li.currentQuantity !== 0 ? li.title : null))
					.filter(Boolean)
			),
		].slice(0, 3) as string[];

		// Fetch blueboxIds for all customer orders
		const allShopifyIds = customer.orders.map((o) => o.shopifyId);
		const blueboxOrders = allShopifyIds.length
			? await this.prisma.blueboxOrder.findMany({
					where: { externalId: { in: allShopifyIds } },
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
		const blueboxByShopifyId = new Map(
			blueboxOrders.map((bb) => [bb.externalId, bb])
		);
		const blueboxShippingByShopifyId = sumBlueboxShipping(blueboxOrders);

		// Build full OrderItem shape so the frontend can reuse the same columns + detail sheet
		const orderHistory: OrderItem[] = customer.orders.map((o) => {
			const bluebox = blueboxByShopifyId.get(o.shopifyId);
			const channel = getChannel({ tags: o.tags, appName: o.appName });
			const lineItems: OrderLineItem[] = o.lineItems.map((li) => ({
				id: li.id,
				sku: li.sku,
				title: li.title,
				variantTitle: li.variantTitle,
				quantity: li.quantity,
				currentQuantity: li.currentQuantity,
				price: li.price,
				totalDiscount: li.totalDiscount,
				discountAllocations: li.discountAllocations as any,
				fulfillmentStatus: li.fulfillmentStatus,
			}));

			const skuList = [
				...new Set(lineItems.map((li) => li.sku).filter(Boolean)),
			] as string[];

			const oGross = calculateGrossRevenue({
				shipping: o.totalShippingPrice,
				lineItems: lineItems.map((li) => ({
					quantity: li.quantity,
					price: li.price ?? 0,
				})),
			});
			const oDiscounts = o.totalDiscounts ?? 0;
			const oRefunds = calculateTotalRefunds({ refunds: o.refunds });
			const oNet = calculateNetRevenue({
				grossRevenue: oGross,
				totalDiscounts: oDiscounts,
				totalRefunds: oRefunds,
			});

			const fulfillments: OrderFulfillment[] = o.fulfillments.map((f) => ({
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
			}));

			return {
				id: o.id,
				shopifyId: o.shopifyId,
				blueboxId: bluebox?.blueboxId ?? null,
				blueboxWorkflowStatus: bluebox?.workflowStatus ?? null,
				orderNumber: o.orderNumber,
				orderName: o.orderName ?? null,
				date: o.shopifyCreatedAt?.toISOString() ?? null,
				cancelledAt: o.cancelledAt?.toISOString() ?? null,
				cancelReason: o.cancelReason ?? null,
				note: o.note ?? null,
				customerId: o.customerId ?? null,
				customerDisplayName: customer.displayName ?? null,
				customerEmail: customer.email ?? o.email ?? null,
				skus: skuList.join(', '),
				netRevenue: oNet,
				totalPrice: o.totalPrice,
				subtotalPrice: o.subtotalPrice,
				totalDiscounts: o.totalDiscounts,
				totalShippingPrice: o.totalShippingPrice,
				totalTax: o.totalTax,
				currency: o.currency,
				paymentStatus: (o.financialStatus as PaymentStatusEnum) ?? null,
				fulfillmentStatus:
					(o.fulfillmentStatus as FulfillmentStatusEnum) ?? null,
				paymentGatewayNames: o.paymentGatewayNames,
				channel,
				tags: o.tags,
				shipName: o.shipName,
				shipCompany: o.shipCompany,
				shipAddress1: o.shipAddress1,
				shipAddress2: o.shipAddress2,
				shipCity: o.shipCity,
				shipProvinceCode: o.shipProvinceCode,
				shipZip: o.shipZip,
				shipCountryCode: o.shipCountryCode,
				shipPhone: o.shipPhone,
				// Cancelled orders are left out of revenue, so they carry no margin
				...(!o.cancelledAt && {
					margin: this.skuCostService.calculateOrderMargin({
						lineItems: lineItems,
						orderDate: o.shopifyCreatedAt,
						channel,
						grossRevenue: oGross,
						totalDiscounts: oDiscounts,
						totalRefunds: oRefunds,
						netRevenue: oNet,
						blueboxShippingCost:
							blueboxShippingByShopifyId.get(o.shopifyId) ?? null,
						costs,
						timeZone,
					}),
				}),
				dateOrderPicked: bluebox?.dateOrderPicked?.toISOString() ?? null,
				dateOrderShipped: bluebox?.dateOrderShipped?.toISOString() ?? null,
				dateOrderDelivered: bluebox?.dateOrderDelivered?.toISOString() ?? null,
				estimatedDeliveryAt:
					o.fulfillments
						.map((f) => f.estimatedDeliveryAt)
						.filter((d): d is Date => d !== null)
						.sort((a, b) => b.getTime() - a.getTime())[0]
						?.toISOString() ?? null,
				blueboxShippingCost: bluebox?.shippingCost ?? null,
				lineItems,
				fulfillments,
			};
		});

		const orderChannels = new Set(orderHistory.map((o) => o.channel));
		const channels = Object.values(ChannelEnum).filter((c) =>
			orderChannels.has(c)
		);

		// Case volume: total units across all non-cancelled orders
		const caseVolume = orders.reduce(
			(sum, o) => sum + o.lineItems.reduce((ls, li) => ls + li.quantity, 0),
			0
		);

		const isB2BCustomer = isB2B(customer);
		const skuVelocity = isB2BCustomer
			? await this.buildSkuVelocity(orders, customer.storeCount)
			: [];

		return {
			id: customer.id,
			shopifyId: customer.shopifyId,
			saueroCode: customer.saueroCode ?? null,
			isB2B: isB2BCustomer,
			storeCount: isB2BCustomer ? customer.storeCount : null,
			firstName: customer.firstName ?? '',
			lastName: customer.lastName ?? '',
			displayName: customer.displayName ?? '',
			company: resolveCompany(customer),
			email: customer.email ?? '',
			phone: customer.phone ?? '',
			note: customer.note ?? null,
			tags: customer.tags,
			channels,
			shopifyCreatedAt: customer.shopifyCreatedAt?.toISOString() ?? '',
			totalOrders: orderCount,
			lastOrderDate: orders[0]?.shopifyCreatedAt?.toISOString() ?? null,
			grossRevenue: Math.round(grossRevenue * 100) / 100,
			netRevenue: Math.round(netRevenue * 100) / 100,
			netAov: Math.round(netAov * 100) / 100,
			grossProfit: Math.round(grossProfit * 100) / 100,
			totalDiscounts: Math.round(totalDiscounts * 100) / 100,
			caseVolume,
			skuVelocity,
			recentSkus,
			orderHistory,
			defaultAddress: customer.addresses.find((a) => a.isDefault) ?? null,
			folkPipelineStatus: customer.folkCompanyMapping?.pipelineStatus ?? null,
			folkCustomerType: customer.folkCompanyMapping?.customerType ?? null,
			folkGroupId: customer.folkCompanyMapping?.folkGroupId ?? null,
			folkCompanyId: customer.folkCompanyMapping?.folkCompanyId ?? null,
			folkLastContactAt:
				customer.folkCompanyMapping?.lastContactAt?.toISOString() ?? null,
			folkLastContactType: customer.folkCompanyMapping?.lastContactType ?? null,
		};
	}

	async updateCustomer(id: string, input: UpdateCustomerInput) {
		const customer = await this.prisma.shopifyCustomer.findUnique({
			where: { id },
			select: {
				id: true,
				tags: true,
				orders: { select: { tags: true, appName: true } },
			},
		});
		if (!customer) {
			throw new NotFoundException(`Customer with id "${id}" not found`);
		}
		if (!isB2B(customer)) {
			throw new BadRequestException(
				'Store count applies to B2B customers only'
			);
		}

		await this.prisma.shopifyCustomer.update({
			where: { id },
			data: { storeCount: input.storeCount },
			select: { id: true, storeCount: true },
		});

		return { message: 'Store count updated' };
	}

	private async buildSkuVelocity(
		orders: {
			shopifyCreatedAt: Date | null;
			lineItems: {
				sku: string | null;
				title: string | null;
				quantity: number;
			}[];
		}[],
		storeCount: number
	): Promise<SkuVelocityItem[]> {
		const weeks = velocityWeeks(orders);

		const skuUnitsMap = new Map<
			string,
			{ title: string | null; units: number; skuSettingId: string | null }
		>();
		const catalog = await loadSkuCatalog(this.prisma);
		for (const o of orders) {
			for (const li of o.lineItems) {
				if (!li.sku) continue;
				const sku = catalog.canonical(li.sku);
				const existing = skuUnitsMap.get(sku) ?? {
					title: li.title,
					units: 0,
					skuSettingId: catalog.resolve(li.sku)?.id ?? null,
				};
				existing.units += li.quantity;
				skuUnitsMap.set(sku, existing);
			}
		}

		const configUnits = await this.loadConfigUnits(
			[...skuUnitsMap.values()]
				.map((v) => v.skuSettingId)
				.filter((id): id is string => id !== null)
		);

		return [...skuUnitsMap.entries()]
			.map(([sku, { title, units, skuSettingId }]) => {
				const unitsPerWeek = weeks ? units / weeks : null;
				const cansPerUnit =
					(skuSettingId && configUnits.get(skuSettingId)) || 1;
				return {
					sku,
					title,
					totalUnits: units,
					unitsPerWeek: roundRate(unitsPerWeek),
					unitsPerStorePerWeek: roundRate(
						unitsPerWeek && unitsPerWeek / storeCount
					),
					cansPerStorePerWeek: roundRate(
						unitsPerWeek && (unitsPerWeek * cansPerUnit) / storeCount
					),
				};
			})
			.sort((a, b) => (b.unitsPerWeek ?? 0) - (a.unitsPerWeek ?? 0));
	}

	/**
	 * "Config (Units)" is a user-created SKU settings column, so it is found by
	 * name and its free-text values parsed. Anything unset or not a positive
	 * number is left out, and callers fall back to 1.
	 */
	private async loadConfigUnits(
		skuSettingIds: string[]
	): Promise<Map<string, number>> {
		if (skuSettingIds.length === 0) return new Map();

		const column = await this.prisma.skuColumn.findFirst({
			where: { name: { equals: 'config (units)', mode: 'insensitive' } },
			select: { id: true },
		});
		if (!column) return new Map();

		const settings = await this.prisma.skuSetting.findMany({
			where: { id: { in: skuSettingIds } },
			select: { id: true, customFields: true },
		});

		const result = new Map<string, number>();
		for (const s of settings) {
			const raw = ((s.customFields ?? {}) as Record<string, unknown>)[
				column.id
			];
			const value =
				typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
			if (Number.isFinite(value) && value > 0) result.set(s.id, value);
		}
		return result;
	}

	/**
	 * COGS for a customer's orders, priced per SKU as of each order's date — the
	 * same line predicate and costs as the Revenue page, so the two agree.
	 * A SKU with no COGS entered counts as $0.
	 */
	private calculateCustomerCogs(
		orders: {
			shopifyCreatedAt: Date | null;
			lineItems: {
				sku: string | null;
				quantity: number;
				currentQuantity: number | null;
			}[];
		}[],
		costs: SkuCostLookup,
		timeZone?: string
	): number {
		return calculateCogs({
			lineItems: orders.flatMap((order) => {
				if (!order.shopifyCreatedAt) return [];
				const dayKey = formatDayKeyInTimeZone(order.shopifyCreatedAt, timeZone);
				return order.lineItems.flatMap((li) =>
					li.sku && li.currentQuantity !== 0
						? [
								{
									quantity: li.quantity,
									cogsPerUnit: costs.cogs(li.sku, dayKey)?.amount ?? 0,
								},
							]
						: []
				);
			}),
		});
	}
}
