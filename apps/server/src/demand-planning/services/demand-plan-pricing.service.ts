import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import type { DemandPlanPricingType } from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import type {
	CreateSkuChannelFulfillmentCostDto,
	CreateSkuChannelPriceDto,
	CreateSkuCogsDto,
} from 'src/sku/dto/create-sku-pricing.dto';
import { assertPlanEditable } from '../helpers/plan-lock';
import { DemandPlanAuditService } from './demand-plan-audit.service';

/**
 * The plan's own copy of COGS, per-channel fulfillment cost and per-channel
 * price, taken from SKU settings when the plan was created.
 *
 * It is a copy so a later SKU settings edit cannot move a plan's revenue. Rows
 * are append-only and effective-dated: the value in force on a date is the
 * newest row whose effectiveFrom is on or before it.
 */

/** A calendar day, stored at UTC midnight so a local parse cannot shift it. */
function toEffectiveDate(input: string): Date {
	const [datePart] = input.split('T');
	return new Date(`${datePart}T00:00:00.000Z`);
}

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const money = (amount: number) =>
	`$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;

/** Float addition leaves cent dust (0.1 + 0.2), so totals round to cents. */
const toTotal = (...parts: number[]): number =>
	Math.round(parts.reduce((sum, part) => sum + part, 0) * 100) / 100;

@Injectable()
export class DemandPlanPricingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly audit: DemandPlanAuditService
	) {}

	async getPricing(planId: string): Promise<DemandPlanPricingType> {
		await this.requirePlan(planId);

		const [cogs, channelFulfillmentCosts, channelPrices] = await Promise.all([
			this.prisma.demandPlanCogs.findMany({
				where: { planId },
				orderBy: { effectiveFrom: 'desc' },
			}),
			this.prisma.demandPlanChannelFulfillmentCost.findMany({
				where: { planId },
				orderBy: { effectiveFrom: 'desc' },
			}),
			this.prisma.demandPlanChannelPrice.findMany({
				where: { planId },
				orderBy: { effectiveFrom: 'desc' },
			}),
		]);

		return { cogs, channelFulfillmentCosts, channelPrices };
	}

	async addCogs(
		planId: string,
		skuSettingId: string,
		dto: CreateSkuCogsDto,
		session: UserSession
	) {
		await this.requireEditable(planId, skuSettingId);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.demandPlanCogs.findUnique({
			where: {
				planId_skuSettingId_effectiveFrom: {
					planId,
					skuSettingId,
					effectiveFrom,
				},
			},
		});
		if (clash) {
			throw new ConflictException(
				`A cost version already starts on ${toDateKey(effectiveFrom)} for this SKU`
			);
		}

		const created = await this.prisma.demandPlanCogs.create({
			data: {
				planId,
				skuSettingId,
				materials: dto.materials,
				production: dto.production,
				shipping: dto.shipping,
				amount: toTotal(dto.materials, dto.production, dto.shipping),
				effectiveFrom,
			},
		});

		await this.audit.record(
			planId,
			`set the cost of ${await this.audit.skuLabel(skuSettingId)} to ${money(created.amount)} from ${toDateKey(effectiveFrom)}`,
			session
		);

		return created;
	}

	async addChannelFulfillmentCost(
		planId: string,
		skuSettingId: string,
		dto: CreateSkuChannelFulfillmentCostDto,
		session: UserSession
	) {
		await this.requireEditable(planId, skuSettingId, dto.channel);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.demandPlanChannelFulfillmentCost.findUnique(
			{
				where: {
					planId_skuSettingId_channel_effectiveFrom: {
						planId,
						skuSettingId,
						channel: dto.channel,
						effectiveFrom,
					},
				},
			}
		);
		if (clash) {
			throw new ConflictException(
				`A fulfillment cost already starts on ${toDateKey(effectiveFrom)} for this SKU in ${dto.channel}`
			);
		}

		const created = await this.prisma.demandPlanChannelFulfillmentCost.create({
			data: {
				planId,
				skuSettingId,
				channel: dto.channel,
				storage: dto.storage,
				pick: dto.pick,
				pack: dto.pack,
				shipping: dto.shipping,
				amount: toTotal(dto.storage, dto.pick, dto.pack, dto.shipping),
				effectiveFrom,
			},
		});

		await this.audit.record(
			planId,
			`set the fulfillment cost of ${await this.audit.skuLabel(skuSettingId)} in ${dto.channel} to ${money(created.amount)} from ${toDateKey(effectiveFrom)}`,
			session
		);

		return created;
	}

	async addChannelPrice(
		planId: string,
		skuSettingId: string,
		dto: CreateSkuChannelPriceDto,
		session: UserSession
	) {
		await this.requireEditable(planId, skuSettingId, dto.channel);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.demandPlanChannelPrice.findUnique({
			where: {
				planId_skuSettingId_channel_effectiveFrom: {
					planId,
					skuSettingId,
					channel: dto.channel,
					effectiveFrom,
				},
			},
		});
		if (clash) {
			throw new ConflictException(
				`A price already starts on ${toDateKey(effectiveFrom)} for this SKU in ${dto.channel}`
			);
		}

		const created = await this.prisma.demandPlanChannelPrice.create({
			data: {
				planId,
				skuSettingId,
				channel: dto.channel,
				amount: dto.amount,
				effectiveFrom,
			},
		});

		await this.audit.record(
			planId,
			`set the price of ${await this.audit.skuLabel(skuSettingId)} in ${dto.channel} to ${money(created.amount)} from ${toDateKey(effectiveFrom)}`,
			session
		);

		return created;
	}

	async removeCogs(planId: string, id: string, session: UserSession) {
		await this.requirePlanEditable(planId);

		// Read before deleting, so the trail can name what went.
		const version = await this.prisma.demandPlanCogs.findFirst({
			where: { id, planId },
		});
		if (!version) throw new NotFoundException('Cost version not found');

		await this.prisma.demandPlanCogs.delete({ where: { id } });
		await this.audit.record(
			planId,
			`removed the ${toDateKey(version.effectiveFrom)} cost of ${await this.audit.skuLabel(version.skuSettingId)}`,
			session
		);

		return { message: 'Cost version removed' };
	}

	async removeChannelFulfillmentCost(
		planId: string,
		id: string,
		session: UserSession
	) {
		await this.requirePlanEditable(planId);

		const version =
			await this.prisma.demandPlanChannelFulfillmentCost.findFirst({
				where: { id, planId },
			});
		if (!version) throw new NotFoundException('Fulfillment cost not found');

		await this.prisma.demandPlanChannelFulfillmentCost.delete({
			where: { id },
		});
		await this.audit.record(
			planId,
			`removed the ${toDateKey(version.effectiveFrom)} fulfillment cost of ${await this.audit.skuLabel(version.skuSettingId)} in ${version.channel}`,
			session
		);

		return { message: 'Fulfillment cost removed' };
	}

	async removeChannelPrice(planId: string, id: string, session: UserSession) {
		await this.requirePlanEditable(planId);

		const version = await this.prisma.demandPlanChannelPrice.findFirst({
			where: { id, planId },
		});
		if (!version) throw new NotFoundException('Price version not found');

		await this.prisma.demandPlanChannelPrice.delete({ where: { id } });
		await this.audit.record(
			planId,
			`removed the ${toDateKey(version.effectiveFrom)} price of ${await this.audit.skuLabel(version.skuSettingId)} in ${version.channel}`,
			session
		);

		return { message: 'Price removed' };
	}

	private async requirePlan(planId: string) {
		const plan = await this.prisma.demandPlan.findUnique({
			where: { id: planId },
			include: { channelScopes: true },
		});
		if (!plan) throw new NotFoundException('Demand plan not found');
		return plan;
	}

	private async requirePlanEditable(planId: string) {
		const plan = await this.requirePlan(planId);
		assertPlanEditable(plan);
		return plan;
	}

	private async requireEditable(
		planId: string,
		skuSettingId: string,
		channel?: string
	) {
		const plan = await this.requirePlanEditable(planId);

		const inScope = plan.channelScopes.some(
			(scope) =>
				(channel === undefined || scope.channel === channel) &&
				scope.skuSettingIds.includes(skuSettingId)
		);
		if (!inScope) {
			throw new BadRequestException(
				channel
					? 'That SKU is not in scope for this channel'
					: 'That SKU is not in scope for this plan'
			);
		}

		return plan;
	}
}
