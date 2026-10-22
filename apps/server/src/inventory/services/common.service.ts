import { Injectable } from '@nestjs/common';
import { InventoryLocationType } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { loadSkuCatalog } from 'src/sku/sku-catalog';

@Injectable()
export class CommonInventoryService {
	constructor(private readonly prisma: PrismaService) {}

	async getLocation(type: 'idrive' | 'manuel-brothers') {
		const locations = await this.prisma.shopifyLocation.findMany();

		const filteredLocation = locations.find((location) => {
			if (type === 'idrive') {
				return location.name.toLowerCase().includes('idrive');
			} else if (type === 'manuel-brothers') {
				return location.name.toLowerCase().includes('manuel');
			}
			return true;
		});

		return filteredLocation;
	}

	async getLocationInventory(
		type: 'idrive' | 'manuel-brothers'
	): Promise<InventoryLocationType[]> {
		const location = await this.getLocation(type);
		if (!location) return [];

		const inventory = await this.prisma.shopifyInventoryLevel.findMany({
			where: {
				locationId: location.id,
			},
			include: {
				inventoryItem: true,
			},
		});

		const catalog = await loadSkuCatalog(this.prisma);

		// Several Shopify variants can carry the same SKU, each with its own level
		// at the location; they are one physical product, so they share one row.
		const bySku = new Map<string, InventoryLocationType>();

		for (const level of inventory) {
			const setting = catalog.resolve(level.inventoryItem.sku);
			if (!setting) continue;
			const key = setting.id;

			const existing = bySku.get(key);
			if (existing) {
				existing.available += level.available;
				existing.committed += level.committed;
				existing.damaged += level.damaged;
				existing.incoming += level.incoming;
				existing.onHand += level.onHand;
				existing.qualityControl += level.qualityControl;
				existing.reserved += level.reserved;
				existing.safetyStock += level.safetyStock;
				continue;
			}

			bySku.set(key, {
				sku: setting.sku,
				description: setting.title || null,
				available: level.available,
				committed: level.committed,
				damaged: level.damaged,
				incoming: level.incoming,
				onHand: level.onHand,
				qualityControl: level.qualityControl,
				reserved: level.reserved,
				safetyStock: level.safetyStock,
				locationId: location.id,
				locationName: location.name,
			});
		}

		return Array.from(bySku.values());
	}
}
