import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlueBoxClient } from '../../bluebox.client';

interface ExternalInventory {
	warehouseCode: string | null;
	sku: string;
	description: string | null;
	rop: number | null;
	onHand: number | null;
	committed: number | null;
	available: number | null;
	backordered: number | null;
	quarantined: number | null;
}

interface ExternalInventoryByLot {
	CustomerSku: string;
	ShortDesc: string;
	Qty: number;
	LotNumber: string;
	ExpirationDate: string | null;
	PhysicalWarehouseId: number;
	Code: string;
}

@Injectable()
export class BlueboxInventorySyncService {
	private readonly logger = new Logger(BlueboxInventorySyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly client: BlueBoxClient
	) {}

	async syncAll(): Promise<void> {
		await this.syncInventory();
		await this.syncInventoryByLot();
	}

	async syncInventory(): Promise<void> {
		this.logger.log('Starting BlueBox inventory sync');

		const response = await this.client.get<{
			count: number;
			products: ExternalInventory[];
		}>('/api/bluebox/inventory', { excludeNoInventory: false });

		const items = response.products ?? [];
		this.logger.log(`Fetched ${items.length} inventory items from BlueBox`);

		const seen = new Set<string>();

		for (const item of items) {
			await this.upsertInventory(item);
			seen.add(`${item.sku}\u0000${item.warehouseCode || ''}`);
		}

		await this.pruneInventory(seen);
	}

	async syncInventoryByLot(): Promise<void> {
		this.logger.log('Starting BlueBox inventory-by-lot sync');

		const response = await this.client.get<{
			count: number;
			products: ExternalInventoryByLot[];
		}>('/api/bluebox/inventory-by-lot');

		const items = response.products ?? [];
		this.logger.log(`Fetched ${items.length} lot inventory items from BlueBox`);

		const seen = new Set<string>();

		for (const item of items) {
			await this.upsertInventoryByLot(item);
			seen.add(
				`${item.CustomerSku}\u0000${item.LotNumber || ''}\u0000${item.Code || ''}`
			);
		}

		await this.pruneInventoryByLot(seen);
	}

	private async pruneInventory(seen: Set<string>): Promise<void> {
		if (seen.size === 0) {
			this.logger.warn('Skipping inventory cleanup — BlueBox returned no SKUs');
			return;
		}

		const existing = await this.prisma.blueboxInventory.findMany({
			select: { id: true, sku: true, warehouseCode: true },
		});

		const staleIds = existing
			.filter((row) => !seen.has(`${row.sku}\u0000${row.warehouseCode}`))
			.map((row) => row.id);

		if (staleIds.length === 0) return;

		const { count } = await this.prisma.blueboxInventory.deleteMany({
			where: { id: { in: staleIds } },
		});

		this.logger.log(`Removed ${count} inventory rows no longer in BlueBox`);
	}

	private async pruneInventoryByLot(seen: Set<string>): Promise<void> {
		if (seen.size === 0) {
			this.logger.warn(
				'Skipping lot inventory cleanup — BlueBox returned no lots'
			);
			return;
		}

		const existing = await this.prisma.blueboxInventoryByLot.findMany({
			select: { id: true, sku: true, lotNumber: true, warehouseCode: true },
		});

		const staleIds = existing
			.filter(
				(row) =>
					!seen.has(
						`${row.sku}\u0000${row.lotNumber}\u0000${row.warehouseCode}`
					)
			)
			.map((row) => row.id);

		if (staleIds.length === 0) return;

		const { count } = await this.prisma.blueboxInventoryByLot.deleteMany({
			where: { id: { in: staleIds } },
		});

		this.logger.log(`Removed ${count} lot inventory rows no longer in BlueBox`);
	}

	private async upsertInventory(item: ExternalInventory): Promise<void> {
		await this.prisma.blueboxInventory.upsert({
			where: {
				sku_warehouseCode: {
					sku: item.sku,
					warehouseCode: item.warehouseCode || '',
				},
			},
			update: {
				description: item.description,
				warehouseCode: item.warehouseCode || '',
				rop: item.rop,
				onHand: item.onHand,
				committed: item.committed,
				available: item.available,
				backordered: item.backordered,
				quarantined: item.quarantined,
			},
			create: {
				sku: item.sku,
				warehouseCode: item.warehouseCode || '',
				description: item.description,
				rop: item.rop,
				onHand: item.onHand,
				committed: item.committed,
				available: item.available,
				backordered: item.backordered,
				quarantined: item.quarantined,
			},
		});
	}

	private async upsertInventoryByLot(
		item: ExternalInventoryByLot
	): Promise<void> {
		const sku = item.CustomerSku;
		const lotNumber = item.LotNumber || '';
		const warehouseCode = item.Code || '';

		await this.prisma.blueboxInventoryByLot.upsert({
			where: {
				sku_lotNumber_warehouseCode: {
					sku,
					lotNumber,
					warehouseCode,
				},
			},
			update: {
				shortDescription: item.ShortDesc,
				qty: item.Qty,
				expirationDate: item.ExpirationDate
					? new Date(item.ExpirationDate)
					: null,
				physicalWarehouseId: item.PhysicalWarehouseId,
			},
			create: {
				sku,
				lotNumber,
				warehouseCode,
				shortDescription: item.ShortDesc,
				qty: item.Qty,
				expirationDate: item.ExpirationDate
					? new Date(item.ExpirationDate)
					: null,
				physicalWarehouseId: item.PhysicalWarehouseId,
			},
		});
	}
}
