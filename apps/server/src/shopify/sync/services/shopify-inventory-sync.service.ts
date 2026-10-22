import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	GET_INVENTORY_ITEMS_PAGE,
	GET_LOCATIONS_PAGE,
	type GetInventoryItemsPageResponseType,
	type GetLocationsPageResponseType,
	type ShopifyInventoryItemNodeType,
	type ShopifyInventoryLevelNodeType,
	type ShopifyLocationNodeType,
} from '../../queries/inventory.queries';
import { ShopifyGraphqlClient } from '../../shopify-graphql.client';
import { extractShopifyId } from '../../utils/shopify-id.utils';

@Injectable()
export class ShopifyInventorySyncService {
	private readonly logger = new Logger(ShopifyInventorySyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly graphql: ShopifyGraphqlClient
	) {}

	async syncAll(): Promise<void> {
		await this.syncLocations();
		await this.syncInventoryItems();
	}

	// ── Locations ─────────────────────────────────────────────────────────────

	async syncLocations(): Promise<void> {
		this.logger.log('Starting location sync');

		let cursor: string | null = null;
		let total = 0;

		do {
			const data = await this.graphql.request<GetLocationsPageResponseType>(
				GET_LOCATIONS_PAGE,
				{ cursor }
			);

			const { edges, pageInfo } = data.locations;

			await Promise.all(edges.map(({ node }) => this.upsertLocation(node)));

			total += edges.length;
			cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
		} while (cursor);

		this.logger.log(`Location sync complete: ${total} locations`);
	}

	private async upsertLocation(node: ShopifyLocationNodeType) {
		const shopifyId = extractShopifyId(node.id);

		return this.prisma.shopifyLocation.upsert({
			where: { shopifyId },
			update: {
				name: node.name,
				active: node.isActive,
				address1: node.address.address1,
				address2: node.address.address2,
				city: node.address.city,
				province: node.address.province,
				country: node.address.country,
				zip: node.address.zip,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				name: node.name,
				active: node.isActive,
				address1: node.address.address1,
				address2: node.address.address2,
				city: node.address.city,
				province: node.address.province,
				country: node.address.country,
				zip: node.address.zip,
			},
		});
	}

	// ── Inventory Items + Levels ──────────────────────────────────────────────

	async syncInventoryItems(): Promise<void> {
		this.logger.log('Starting inventory items sync');

		const locationMap = await this.buildLocationMap();

		let cursor: string | null = null;
		let page = 0;
		let total = 0;

		do {
			const data =
				await this.graphql.request<GetInventoryItemsPageResponseType>(
					GET_INVENTORY_ITEMS_PAGE,
					{ cursor }
				);

			const { edges, pageInfo } = data.inventoryItems;

			await Promise.all(
				edges.map(({ node }) => this.upsertInventoryItem(node, locationMap))
			);

			total += edges.length;
			page++;
			cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

			this.logger.log(
				`Inventory items sync page ${page}: ${edges.length} items (${total} total)`
			);
		} while (cursor);

		this.logger.log(`Inventory items sync complete: ${total} items processed`);
	}

	private async buildLocationMap(): Promise<Map<string, string>> {
		const locations = await this.prisma.shopifyLocation.findMany({
			select: { id: true, shopifyId: true },
		});
		return new Map(locations.map((l) => [l.shopifyId, l.id]));
	}

	private async upsertInventoryItem(
		node: ShopifyInventoryItemNodeType,
		locationMap: Map<string, string>
	) {
		const shopifyId = extractShopifyId(node.id);

		const item = await this.prisma.shopifyInventoryItem.upsert({
			where: { shopifyId },
			update: {
				sku: node.sku,
				tracked: node.tracked,
				unitCostAmount: node.unitCost ? parseFloat(node.unitCost.amount) : null,
				unitCostCurrency: node.unitCost?.currencyCode ?? null,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				sku: node.sku,
				tracked: node.tracked,
				unitCostAmount: node.unitCost ? parseFloat(node.unitCost.amount) : null,
				unitCostCurrency: node.unitCost?.currencyCode ?? null,
			},
		});

		await Promise.all(
			node.inventoryLevels.edges.map(({ node: level }) =>
				this.upsertInventoryLevel(level, item.id, locationMap)
			)
		);
	}

	private async upsertInventoryLevel(
		node: ShopifyInventoryLevelNodeType,
		inventoryItemId: string,
		locationMap: Map<string, string>
	) {
		const locationShopifyId = extractShopifyId(node.location.id);
		const locationId = locationMap.get(locationShopifyId);

		if (!locationId) {
			this.logger.warn(
				`Skipping inventory level — unknown location ${locationShopifyId}`
			);
			return;
		}

		const quantities = Object.fromEntries(
			node.quantities.map((q) => [q.name, q.quantity])
		);

		return this.prisma.shopifyInventoryLevel.upsert({
			where: {
				inventoryItemId_locationId: { inventoryItemId, locationId },
			},
			update: {
				available: quantities.available ?? 0,
				onHand: quantities.on_hand ?? 0,
				committed: quantities.committed ?? 0,
				incoming: quantities.incoming ?? 0,
				reserved: quantities.reserved ?? 0,
				damaged: quantities.damaged ?? 0,
				safetyStock: quantities.safety_stock ?? 0,
				qualityControl: quantities.quality_control ?? 0,
				shopifyUpdatedAt: node.updatedAt ? new Date(node.updatedAt) : null,
				updatedAt: new Date(),
			},
			create: {
				inventoryItemId,
				locationId,
				available: quantities.available ?? 0,
				onHand: quantities.on_hand ?? 0,
				committed: quantities.committed ?? 0,
				incoming: quantities.incoming ?? 0,
				reserved: quantities.reserved ?? 0,
				damaged: quantities.damaged ?? 0,
				safetyStock: quantities.safety_stock ?? 0,
				qualityControl: quantities.quality_control ?? 0,
				shopifyUpdatedAt: node.updatedAt ? new Date(node.updatedAt) : null,
			},
		});
	}
}
