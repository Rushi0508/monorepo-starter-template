import { Injectable, Logger } from '@nestjs/common';
import { FolkMappingStatus } from '@repo/db';
import {
	calculateGrossRevenue,
	calculateNetRevenue,
	calculateTotalRefunds,
} from '@repo/utils';
import { velocityWeeks } from 'src/customers/sku-velocity';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolkApiClient, type FolkCompany } from '../folk.client';
import {
	asComparableFolkValue,
	FOLK_FIELDS,
	folkDateOf,
	serializeFolkValue,
} from '../utils/folk-fields';

export type FolkMetricsPushResult = {
	considered: number;
	patched: number;
	missing: number;
};

type CustomerRef = {
	id: string;
	saueroCode: string | null;
	storeCount: number;
};

type ComputedMetrics = {
	[FOLK_FIELDS.firstOrderDate]: string | null;
	[FOLK_FIELDS.lastOrderDate]: string | null;
	[FOLK_FIELDS.daysSinceLastOrder]: number | null;
	[FOLK_FIELDS.lastOrderValue]: number | null;
	[FOLK_FIELDS.lastOrderQuantity]: number | null;
	[FOLK_FIELDS.averageOrderSize]: number | null;
	[FOLK_FIELDS.lifetimeRevenue]: number;
	[FOLK_FIELDS.lifetimeOrders]: number;
	[FOLK_FIELDS.storeCount]: number;
	[FOLK_FIELDS.retailVelocity]: number | null;
	[FOLK_FIELDS.metricsAsOf]: string | null;
	[FOLK_FIELDS.saueroCustomerId]: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TRAILING_WINDOW_DAYS = 90;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** Same net revenue definition as the Revenue and customer pages. */
function orderNetRevenue(order: {
	totalShippingPrice: number | null;
	totalDiscounts: number | null;
	lineItems: { quantity: number; price: number | null }[];
	refunds: {
		lineItems: { totalTax: number | null }[];
		transactions: { amount: number | null; status: string | null }[];
	}[];
}): number {
	return calculateNetRevenue({
		grossRevenue: calculateGrossRevenue({
			shipping: order.totalShippingPrice,
			lineItems: order.lineItems.map((item) => ({
				quantity: item.quantity,
				price: item.price ?? 0,
			})),
		}),
		totalDiscounts: order.totalDiscounts ?? 0,
		totalRefunds: calculateTotalRefunds({ refunds: order.refunds }),
	});
}

@Injectable()
export class FolkMetricsService {
	private readonly logger = new Logger(FolkMetricsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly folkClient: FolkApiClient
	) {}

	async pushMappedCompanies(): Promise<FolkMetricsPushResult> {
		const mappings = await this.prisma.folkCompanyMapping.findMany({
			where: {
				status: FolkMappingStatus.MAPPED,
				customers: { some: {} },
			},
			include: {
				customers: { select: { id: true, saueroCode: true, storeCount: true } },
			},
		});

		const groupIds = [...new Set(mappings.map((m) => m.folkGroupId))];
		const companies = await Promise.all(
			groupIds.map((groupId) => this.folkClient.listCompaniesInGroup(groupId))
		);
		const companyById = new Map(
			companies.flat().map((company) => [company.id, company])
		);

		let patched = 0;
		let missing = 0;

		for (const mapping of mappings) {
			const company = companyById.get(mapping.folkCompanyId);
			if (!company) {
				missing += 1;
				continue;
			}
			const didPatch = await this.pushOne(
				mapping.customers,
				company,
				mapping.folkGroupId
			);
			if (didPatch) patched += 1;
		}

		this.logger.log(
			`Folk metrics push — considered ${mappings.length}, patched ${patched}, ` +
				`unchanged ${mappings.length - patched - missing}, missing ${missing}`
		);

		return { considered: mappings.length, patched, missing };
	}

	async pushOne(
		customers: CustomerRef[],
		company: FolkCompany,
		groupId: string
	): Promise<boolean> {
		const metrics = await this.computeMetrics(customers);
		const current = this.folkClient.groupCustomFields(company, groupId);

		const changed = Object.fromEntries(
			Object.entries(metrics).filter(
				([field, desired]) =>
					asComparableFolkValue(field, current[field]) !==
					asComparableFolkValue(field, serializeFolkValue(field, desired))
			)
		);

		if (Object.keys(changed).length === 0) return false;

		await this.folkClient.patchCompanyCustomFields(company, groupId, changed);
		return true;
	}

	async computeMetrics(customers: CustomerRef[]): Promise<ComputedMetrics> {
		const customerIds = customers.map((customer) => customer.id);
		const saueroCodes = customers
			.map((customer) => customer.saueroCode)
			.filter((code): code is string => Boolean(code?.trim()));

		const today = folkDateOf(new Date());

		const identity = {
			[FOLK_FIELDS.metricsAsOf]: today,
			[FOLK_FIELDS.saueroCustomerId]: saueroCodes.length
				? saueroCodes.join(',')
				: null,
			[FOLK_FIELDS.storeCount]: customers.reduce(
				(sum, customer) => sum + customer.storeCount,
				0
			),
		};

		const noOrders: ComputedMetrics = {
			...identity,
			[FOLK_FIELDS.lifetimeRevenue]: 0,
			[FOLK_FIELDS.lifetimeOrders]: 0,
			[FOLK_FIELDS.retailVelocity]: null,
			[FOLK_FIELDS.firstOrderDate]: null,
			[FOLK_FIELDS.lastOrderDate]: null,
			[FOLK_FIELDS.daysSinceLastOrder]: null,
			[FOLK_FIELDS.lastOrderValue]: null,
			[FOLK_FIELDS.lastOrderQuantity]: null,
			[FOLK_FIELDS.averageOrderSize]: null,
		};

		if (customerIds.length === 0) return noOrders;

		const orders = (
			await this.prisma.shopifyOrder.findMany({
				where: { customerId: { in: customerIds }, cancelledAt: null },
				select: {
					customerId: true,
					shopifyCreatedAt: true,
					totalShippingPrice: true,
					totalDiscounts: true,
					lineItems: {
						select: {
							sku: true,
							quantity: true,
							currentQuantity: true,
							price: true,
						},
					},
					refunds: {
						select: {
							lineItems: { select: { totalTax: true } },
							transactions: { select: { amount: true, status: true } },
						},
					},
				},
			})
		).map((order) => ({ ...order, netRevenue: orderNetRevenue(order) }));

		const lifetime = {
			[FOLK_FIELDS.lifetimeRevenue]: roundMoney(
				orders.reduce((sum, order) => sum + order.netRevenue, 0)
			),
			[FOLK_FIELDS.lifetimeOrders]: orders.length,
			[FOLK_FIELDS.retailVelocity]: this.retailVelocity(customers, orders),
		};

		const dated = orders.filter(
			(order): order is typeof order & { shopifyCreatedAt: Date } =>
				order.shopifyCreatedAt !== null
		);
		const lastOrder = dated.reduce<(typeof dated)[number] | null>(
			(latest, order) =>
				!latest || order.shopifyCreatedAt > latest.shopifyCreatedAt
					? order
					: latest,
			null
		);

		if (!lastOrder) return { ...noOrders, ...lifetime };

		const lastOrderDate = folkDateOf(lastOrder.shopifyCreatedAt);
		const firstOrder = dated.reduce((earliest, order) =>
			order.shopifyCreatedAt < earliest.shopifyCreatedAt ? order : earliest
		);

		const cases = lastOrder.lineItems.reduce(
			(sum, item) =>
				item.sku && item.currentQuantity !== 0
					? sum + (item.quantity ?? 0)
					: sum,
			0
		);

		const trailingSince = Date.now() - TRAILING_WINDOW_DAYS * DAY_MS;
		const trailing = dated.filter(
			(order) => order.shopifyCreatedAt.getTime() >= trailingSince
		);
		const averageOrderSize = trailing.length
			? roundMoney(
					trailing.reduce((sum, order) => sum + order.netRevenue, 0) /
						trailing.length
				)
			: null;

		return {
			...identity,
			...lifetime,
			[FOLK_FIELDS.firstOrderDate]: folkDateOf(firstOrder.shopifyCreatedAt),
			[FOLK_FIELDS.lastOrderDate]: lastOrderDate,
			[FOLK_FIELDS.daysSinceLastOrder]: Math.round(
				(Date.parse(today) - Date.parse(lastOrderDate)) / DAY_MS
			),
			[FOLK_FIELDS.lastOrderValue]: roundMoney(lastOrder.netRevenue),
			[FOLK_FIELDS.lastOrderQuantity]: cases,
			[FOLK_FIELDS.averageOrderSize]: averageOrderSize,
		};
	}

	/**
	 * Units per store per week across every linked customer, measured the same
	 * way as the customer page's Units / Store / Week. Only customers with a
	 * measurable rate count, so a location with one order does not dilute it.
	 */
	private retailVelocity(
		customers: CustomerRef[],
		orders: {
			customerId: string | null;
			shopifyCreatedAt: Date | null;
			lineItems: { sku: string | null; quantity: number }[];
		}[]
	): number | null {
		let unitsPerWeek = 0;
		let stores = 0;

		for (const customer of customers) {
			const customerOrders = orders.filter(
				(order) => order.customerId === customer.id
			);
			const weeks = velocityWeeks(customerOrders);
			if (!weeks) continue;

			const units = customerOrders.reduce(
				(sum, order) =>
					sum +
					order.lineItems.reduce(
						(lineSum, item) => (item.sku ? lineSum + item.quantity : lineSum),
						0
					),
				0
			);
			unitsPerWeek += units / weeks;
			stores += customer.storeCount;
		}

		return stores > 0 ? roundMoney(unitsPerWeek / stores) : null;
	}
}
