import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	SESSIONS_CHANNEL_DEVICE_QUERY,
	SESSIONS_DAILY_QUERY,
	SessionsChannelDeviceRow,
	SessionsDailyRow,
	SHOPIFYQL_OPERATION,
	type ShopifyQLQueryResponse,
	type ShopifyQLTableData,
} from '../../queries/analytics.queries';
import { ShopifyGraphqlClient } from '../../shopify-graphql.client';

@Injectable()
export class ShopifyAnalyticsSyncService {
	private readonly logger = new Logger(ShopifyAnalyticsSyncService.name);

	constructor(
		private readonly graphql: ShopifyGraphqlClient,
		private readonly prisma: PrismaService
	) {}

	// ─── Public ────────────────────────────────────────────────────────────────

	async syncAll(): Promise<void> {
		await this.syncSessionsDaily();
		await this.syncSessionsChannelDevice();
	}

	async syncSessionsDaily(): Promise<void> {
		const rows =
			await this.runShopifyQL<SessionsDailyRow>(SESSIONS_DAILY_QUERY);

		const limit = pLimit(10);
		await Promise.all(
			rows.map((row) =>
				limit(async () => {
					const date = new Date(row.day);
					const data = {
						date,
						sessions: row.sessions,
						completedCheckouts: row.sessions_that_completed_checkout ?? 0,
						conversionRate: Number(
							((row.conversion_rate ?? 0) * 100).toFixed(2)
						),
					};
					await this.prisma.shopifySessionsDaily.upsert({
						where: { date },
						create: data,
						update: data,
					});
				})
			)
		);
		this.logger.log(`Synced ${rows.length} daily session rows`);
	}

	async syncSessionsChannelDevice(): Promise<void> {
		const rows = await this.runShopifyQL<SessionsChannelDeviceRow>(
			SESSIONS_CHANNEL_DEVICE_QUERY
		);

		const limit = pLimit(10);
		await Promise.all(
			rows.map((row) =>
				limit(async () => {
					const date = new Date(row.day);

					// Direct/untagged traffic returns blank on channel; device has an
					// "other"/blank bucket. Coalesce so the compound unique key holds.
					const referringChannel =
						(row.referring_channel ?? '').trim() || 'unknown';
					const deviceType =
						((row.session_device_type ?? '') as string).trim() || 'unknown';

					const data = {
						date,
						referringChannel,
						deviceType,
						sessions: row.sessions,
						completedCheckouts: row.sessions_that_completed_checkout ?? 0,
					};
					await this.prisma.shopifySessionsChannelDeviceDaily.upsert({
						where: {
							date_referringChannel_deviceType: {
								date,
								referringChannel,
								deviceType,
							},
						},
						create: data,
						update: data,
					});
				})
			)
		);
		this.logger.log(`Synced ${rows.length} channel/device session rows`);
	}

	// ─── Private helpers ───────────────────────────────────────────────────────

	private async runShopifyQL<T extends Record<string, unknown>>(
		shopifyqlQuery: string
	): Promise<T[]> {
		const response = await this.graphql.request<ShopifyQLQueryResponse>(
			SHOPIFYQL_OPERATION,
			{
				query: shopifyqlQuery.trim(),
			}
		);

		const { tableData, parseErrors } = response.shopifyqlQuery;

		if (parseErrors?.length) {
			throw new Error(`ShopifyQL parse error: ${parseErrors.join('; ')}`);
		}

		if (!tableData) {
			return [];
		}

		return this.parseTableData<T>(tableData);
	}

	private parseTableData<T extends Record<string, unknown>>(
		tableData: ShopifyQLTableData
	): T[] {
		const { columns, rows } = tableData;
		const numericTypes = new Set([
			'INTEGER',
			'FLOAT',
			'PERCENT',
			'DECIMAL',
			'CURRENCY',
		]);
		return rows.map((row) => {
			const obj: Record<string, unknown> = {};
			for (const col of columns) {
				const raw = row[col.name] ?? null;
				obj[col.name] =
					raw !== null && numericTypes.has(col.dataType) ? Number(raw) : raw;
			}
			return obj as T;
		});
	}
}
