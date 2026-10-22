import { Injectable, Logger } from '@nestjs/common';
import type { SimplyDepoCatalogProduct } from '@repo/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { SimplyDepoService } from '../../services/simplydepo.service';

@Injectable()
export class SimplyDepoProductSyncService {
	private readonly logger = new Logger(SimplyDepoProductSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly simplyDepo: SimplyDepoService
	) {}

	async syncAll(): Promise<number> {
		const products = await this.simplyDepo.getProducts();
		this.logger.log(`Upserting ${products.length} SimplyDepo product(s)`);

		for (const product of products) {
			await this.upsertProduct(product);
		}

		return products.length;
	}

	async upsertProduct(product: SimplyDepoCatalogProduct) {
		return this.prisma.simplyDepoProduct.upsert({
			where: { simplydepoId: product.id },
			update: {
				name: product.name,
				sku: product.sku,
				barcode: product.barcode,
				tags: product.tags,
				description: product.description,
				wholesalePrice: product.wholesalePrice,
				retailPrice: product.retailPrice,
				costPrice: product.costPrice,
				itemsPerCase: product.itemsPerCase,
				inventoryOnHand: product.inventoryOnHand,
			},
			create: {
				simplydepoId: product.id,
				name: product.name,
				sku: product.sku,
				barcode: product.barcode,
				tags: product.tags,
				description: product.description,
				wholesalePrice: product.wholesalePrice,
				retailPrice: product.retailPrice,
				costPrice: product.costPrice,
				itemsPerCase: product.itemsPerCase,
				inventoryOnHand: product.inventoryOnHand,
			},
		});
	}
}
