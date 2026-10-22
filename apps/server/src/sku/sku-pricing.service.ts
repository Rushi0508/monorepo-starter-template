import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { SkuSetting } from '@repo/db';
import type { SkuSettingType } from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	CreateSkuChannelFulfillmentCostDto,
	CreateSkuChannelPriceDto,
	CreateSkuCogsDto,
	CreateSkuMsrpDto,
} from './dto/create-sku-pricing.dto';
import { formatSkuLabel, SkuAuditLogService } from './sku-audit-log.service';

/**
 * COGS, per-channel fulfillment cost, MSRP and per-channel prices, all
 * effective-dated. Landed cost is not stored: it is COGS plus the fulfillment
 * cost of the channel a unit sells through.
 *
 * Versions are append-only. The value in force on a date is the newest row whose
 * effectiveFrom is on or before that date, so entering a new price never changes
 * what a past date reports — which is what demand planning depends on.
 */

/**
 * An effective date is a calendar day, so it is stored at UTC midnight. Parsing
 * the date part directly avoids a local-timezone parse shifting it a day.
 */
function toEffectiveDate(input: string): Date {
	const [datePart] = input.split('T');
	return new Date(`${datePart}T00:00:00.000Z`);
}

const toDateKey = (date: Date): string =>
	date.toISOString().slice(0, 10) as string;

/** Float addition leaves cent dust (0.1 + 0.2), so totals round to cents. */
const toTotal = (...parts: number[]): number =>
	Math.round(parts.reduce((sum, part) => sum + part, 0) * 100) / 100;

@Injectable()
export class SkuPricingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly auditLog: SkuAuditLogService
	) {}

	private async requireSetting(skuSettingId: string): Promise<SkuSetting> {
		const setting = await this.prisma.skuSetting.findUnique({
			where: { id: skuSettingId },
		});

		if (!setting) throw new NotFoundException('SKU setting not found');
		return setting;
	}

	async getPricing(skuSettingId: string): Promise<SkuSettingType> {
		const setting = await this.requireSetting(skuSettingId);

		const [cogs, channelFulfillmentCosts, channelPrices, msrps] =
			await Promise.all([
				this.prisma.skuCogs.findMany({
					where: { skuSettingId: setting.id },
					orderBy: { effectiveFrom: 'desc' },
				}),
				this.prisma.skuChannelFulfillmentCost.findMany({
					where: { skuSettingId: setting.id },
					orderBy: [{ channel: 'asc' }, { effectiveFrom: 'desc' }],
				}),
				this.prisma.skuChannelPrice.findMany({
					where: { skuSettingId: setting.id },
					orderBy: [{ channel: 'asc' }, { effectiveFrom: 'desc' }],
				}),
				this.prisma.skuMsrp.findMany({
					where: { skuSettingId: setting.id },
					orderBy: { effectiveFrom: 'desc' },
				}),
			]);

		return {
			...setting,
			cogs,
			channelFulfillmentCosts,
			channelPrices,
			msrps,
		};
	}

	async addCogs(
		skuSettingId: string,
		dto: CreateSkuCogsDto,
		session: UserSession
	) {
		const setting = await this.requireSetting(skuSettingId);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.skuCogs.findUnique({
			where: {
				skuSettingId_effectiveFrom: { skuSettingId: setting.id, effectiveFrom },
			},
		});
		if (clash) {
			throw new ConflictException(
				`A COGS version already starts on ${toDateKey(effectiveFrom)} for this SKU`
			);
		}

		const amount = toTotal(dto.materials, dto.production, dto.shipping);

		await this.prisma.skuCogs.create({
			data: {
				skuSettingId: setting.id,
				materials: dto.materials,
				production: dto.production,
				shipping: dto.shipping,
				amount,
				effectiveFrom,
			},
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} set COGS ${amount} (materials ${dto.materials} + production ${dto.production} + shipping ${dto.shipping}) for ${formatSkuLabel(
				setting.sku,
				setting.title
			)} from ${toDateKey(effectiveFrom)}`,
			{ skuSettingId: setting.id }
		);

		return { message: 'COGS added' };
	}

	async addChannelFulfillmentCost(
		skuSettingId: string,
		dto: CreateSkuChannelFulfillmentCostDto,
		session: UserSession
	) {
		const setting = await this.requireSetting(skuSettingId);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.skuChannelFulfillmentCost.findUnique({
			where: {
				skuSettingId_channel_effectiveFrom: {
					skuSettingId: setting.id,
					channel: dto.channel,
					effectiveFrom,
				},
			},
		});
		if (clash) {
			throw new ConflictException(
				`A ${dto.channel} fulfillment cost already starts on ${toDateKey(effectiveFrom)} for this SKU`
			);
		}

		const amount = toTotal(dto.storage, dto.pick, dto.pack, dto.shipping);

		await this.prisma.skuChannelFulfillmentCost.create({
			data: {
				skuSettingId: setting.id,
				channel: dto.channel,
				storage: dto.storage,
				pick: dto.pick,
				pack: dto.pack,
				shipping: dto.shipping,
				amount,
				effectiveFrom,
			},
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} set ${dto.channel} fulfillment cost ${amount} (storage ${dto.storage} + pick ${dto.pick} + pack ${dto.pack} + shipping ${dto.shipping}) for ${formatSkuLabel(
				setting.sku,
				setting.title
			)} from ${toDateKey(effectiveFrom)}`,
			{ skuSettingId: setting.id }
		);

		return { message: 'Fulfillment cost added' };
	}

	async addChannelPrice(
		skuSettingId: string,
		dto: CreateSkuChannelPriceDto,
		session: UserSession
	) {
		const setting = await this.requireSetting(skuSettingId);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.skuChannelPrice.findUnique({
			where: {
				skuSettingId_channel_effectiveFrom: {
					skuSettingId: setting.id,
					channel: dto.channel,
					effectiveFrom,
				},
			},
		});
		if (clash) {
			throw new ConflictException(
				`A ${dto.channel} price already starts on ${toDateKey(effectiveFrom)} for this SKU`
			);
		}

		await this.prisma.skuChannelPrice.create({
			data: {
				skuSettingId: setting.id,
				channel: dto.channel,
				amount: dto.amount,
				effectiveFrom,
			},
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} set ${dto.channel} price ${dto.amount} for ${formatSkuLabel(
				setting.sku,
				setting.title
			)} from ${toDateKey(effectiveFrom)}`,
			{ skuSettingId: setting.id }
		);

		return { message: 'Price added' };
	}

	async addMsrp(
		skuSettingId: string,
		dto: CreateSkuMsrpDto,
		session: UserSession
	) {
		const setting = await this.requireSetting(skuSettingId);
		const effectiveFrom = toEffectiveDate(dto.effectiveFrom);

		const clash = await this.prisma.skuMsrp.findUnique({
			where: {
				skuSettingId_effectiveFrom: { skuSettingId: setting.id, effectiveFrom },
			},
		});
		if (clash) {
			throw new ConflictException(
				`An MSRP already starts on ${toDateKey(effectiveFrom)} for this SKU`
			);
		}

		await this.prisma.skuMsrp.create({
			data: {
				skuSettingId: setting.id,
				amount: dto.amount,
				effectiveFrom,
			},
		});

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} set MSRP ${dto.amount} for ${formatSkuLabel(
				setting.sku,
				setting.title
			)} from ${toDateKey(effectiveFrom)}`,
			{ skuSettingId: setting.id }
		);

		return { message: 'MSRP added' };
	}

	async deleteCogs(id: string, session: UserSession) {
		const row = await this.prisma.skuCogs.findUnique({
			where: { id },
			include: { skuSetting: true },
		});
		if (!row) throw new NotFoundException('COGS version not found');

		await this.prisma.skuCogs.delete({ where: { id } });

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} removed the COGS from ${toDateKey(
				row.effectiveFrom
			)} for ${formatSkuLabel(row.skuSetting.sku, row.skuSetting.title)}`,
			{ skuSettingId: row.skuSettingId }
		);

		return { message: 'COGS version removed' };
	}

	async deleteChannelFulfillmentCost(id: string, session: UserSession) {
		const row = await this.prisma.skuChannelFulfillmentCost.findUnique({
			where: { id },
			include: { skuSetting: true },
		});
		if (!row) throw new NotFoundException('Fulfillment cost version not found');

		await this.prisma.skuChannelFulfillmentCost.delete({ where: { id } });

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} removed the ${row.channel} fulfillment cost from ${toDateKey(
				row.effectiveFrom
			)} for ${formatSkuLabel(row.skuSetting.sku, row.skuSetting.title)}`,
			{ skuSettingId: row.skuSettingId }
		);

		return { message: 'Fulfillment cost version removed' };
	}

	async deleteChannelPrice(id: string, session: UserSession) {
		const row = await this.prisma.skuChannelPrice.findUnique({
			where: { id },
			include: { skuSetting: true },
		});
		if (!row) throw new NotFoundException('Price version not found');

		await this.prisma.skuChannelPrice.delete({ where: { id } });

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} removed the ${row.channel} price from ${toDateKey(
				row.effectiveFrom
			)} for ${formatSkuLabel(row.skuSetting.sku, row.skuSetting.title)}`,
			{ skuSettingId: row.skuSettingId }
		);

		return { message: 'Price version removed' };
	}

	async deleteMsrp(id: string, session: UserSession) {
		const row = await this.prisma.skuMsrp.findUnique({
			where: { id },
			include: { skuSetting: true },
		});
		if (!row) throw new NotFoundException('MSRP version not found');

		await this.prisma.skuMsrp.delete({ where: { id } });

		await this.auditLog.recordEvent(
			session,
			`${session.user.name} removed the MSRP from ${toDateKey(
				row.effectiveFrom
			)} for ${formatSkuLabel(row.skuSetting.sku, row.skuSetting.title)}`,
			{ skuSettingId: row.skuSettingId }
		);

		return { message: 'MSRP version removed' };
	}
}
