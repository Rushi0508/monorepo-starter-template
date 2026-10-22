import { Injectable } from '@nestjs/common';
import type { Prisma } from '@repo/db';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * A plan's activity trail.
 *
 * A plan's numbers are computed rather than stored, so this is the only record
 * of why it looks the way it does — who changed a method, who moved a price,
 * who signed it off.
 */

type Tx = Prisma.TransactionClient;

export const formatSkuLabel = (sku: string, title?: string | null): string =>
	title?.trim() && title.trim() !== sku ? `${title.trim()} - ${sku}` : sku;

@Injectable()
export class DemandPlanAuditService {
	constructor(private readonly prisma: PrismaService) {}

	/** `activity` reads as a sentence with the actor already in it. */
	async record(
		planId: string,
		activity: string,
		session: UserSession,
		tx?: Tx
	): Promise<void> {
		const client = tx ?? this.prisma;

		await client.demandPlanAudit.create({
			data: {
				planId,
				activity: `${session.user.name} ${activity}`,
				userId: session.user.id,
			},
		});
	}

	/** The SKU as it should read in the trail, looked up once by id. */
	async skuLabel(skuSettingId: string): Promise<string> {
		const setting = await this.prisma.skuSetting.findUnique({
			where: { id: skuSettingId },
			select: { sku: true, title: true },
		});
		return setting ? formatSkuLabel(setting.sku, setting.title) : 'a SKU';
	}
}
