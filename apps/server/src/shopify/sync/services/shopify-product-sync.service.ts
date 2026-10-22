import { Injectable, Logger } from '@nestjs/common';
import type { ShopifyProduct, ShopifyProductVariant } from '@repo/db';
import { PrismaService } from 'src/prisma/prisma.service';
import {
	GET_PRODUCT_BY_ID,
	GET_PRODUCTS_PAGE,
	type GetProductByIdResponseType,
	type GetProductsPageResponseType,
	type ShopifyProductNodeType,
	type ShopifyVariantNodeType,
} from '../../queries/product.queries';
import { ShopifyGraphqlClient } from '../../shopify-graphql.client';
import {
	buildShopifyGid,
	extractShopifyId,
} from '../../utils/shopify-id.utils';

@Injectable()
export class ShopifyProductSyncService {
	private readonly logger = new Logger(ShopifyProductSyncService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly graphql: ShopifyGraphqlClient
	) {}

	async findByShopifyId(shopifyId: string): Promise<ShopifyProduct | null> {
		return this.prisma.shopifyProduct.findUnique({ where: { shopifyId } });
	}

	async findVariantByShopifyId(
		shopifyId: string
	): Promise<ShopifyProductVariant | null> {
		return this.prisma.shopifyProductVariant.findUnique({
			where: { shopifyId },
		});
	}

	async upsertProduct(node: ShopifyProductNodeType): Promise<ShopifyProduct> {
		const shopifyId = extractShopifyId(node.id);

		const product = await this.prisma.shopifyProduct.upsert({
			where: { shopifyId },
			update: {
				title: node.title,
				vendor: node.vendor,
				productType: node.productType,
				status: node.status,
				tags: node.tags,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				title: node.title,
				vendor: node.vendor,
				productType: node.productType,
				status: node.status,
				tags: node.tags,
				shopifyCreatedAt: new Date(node.createdAt),
			},
		});

		await Promise.all(
			node.variants.edges.map(({ node: variant }) =>
				this.upsertVariant(variant, product.id)
			)
		);

		return product;
	}

	async upsertVariant(
		node: ShopifyVariantNodeType,
		productId: string
	): Promise<ShopifyProductVariant> {
		const shopifyId = extractShopifyId(node.id);

		return this.prisma.shopifyProductVariant.upsert({
			where: { shopifyId },
			update: {
				sku: node.sku,
				barcode: node.barcode,
				price: parseFloat(node.price),
				title: node.title,
				inventoryQuantity: node.inventoryQuantity,
				updatedAt: new Date(),
			},
			create: {
				shopifyId,
				productId,
				sku: node.sku,
				barcode: node.barcode,
				price: parseFloat(node.price),
				title: node.title,
				inventoryQuantity: node.inventoryQuantity,
				shopifyCreatedAt: new Date(node.createdAt),
			},
		});
	}

	/**
	 * Fetches a single product from Shopify by GID and upserts it.
	 * Called on-demand when an order references a product not yet in the DB.
	 */
	async fetchAndUpsertByShopifyId(
		shopifyProductId: string
	): Promise<ShopifyProduct | null> {
		this.logger.log(`On-demand product fetch: ${shopifyProductId}`);

		// Accept either a GID or a plain numeric ID
		const gid = buildShopifyGid('Product', shopifyProductId);

		const data = await this.graphql.request<GetProductByIdResponseType>(
			GET_PRODUCT_BY_ID,
			{ id: gid }
		);

		if (!data.product) {
			this.logger.warn(`Product not found on Shopify: ${shopifyProductId}`);
			return null;
		}

		return this.upsertProduct(data.product);
	}

	/**
	 * Fetches all products from Shopify page by page and upserts each one.
	 * Called by the scheduler for the full periodic sync.
	 */
	async syncAll(): Promise<void> {
		this.logger.log('Starting full product sync');

		let cursor: string | null = null;
		let page = 0;
		let total = 0;

		do {
			const data = await this.graphql.request<GetProductsPageResponseType>(
				GET_PRODUCTS_PAGE,
				{ cursor }
			);

			const { edges, pageInfo } = data.products;

			await Promise.all(edges.map(({ node }) => this.upsertProduct(node)));

			total += edges.length;
			page++;
			cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

			this.logger.log(
				`Product sync page ${page}: ${edges.length} products (${total} total so far)`
			);
		} while (cursor);

		this.logger.log(`Product sync complete: ${total} products processed`);
	}
}
