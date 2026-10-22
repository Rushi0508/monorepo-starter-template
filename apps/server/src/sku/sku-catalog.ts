import type { Prisma } from '@repo/db';

export type SkuCatalogEntry = { id: string; sku: string; title: string | null };

export type SkuCatalog = {
	// Which SKU settings entry does this SKU resolve to?
	resolve: (sku: string | null | undefined) => SkuCatalogEntry | null;
	// The canonical SKU code for this entry.
	canonical: (sku: string) => string;
	// Expand a list of SKUs to include all the codes that resolve to the same entry.
	expand: (skus: string[]) => string[];
};

export const skuKey = (sku: string) => sku.trim().toLowerCase();

/**
 * Orders, inventory and 3PL records keep the SKU code they were created under,
 * so every match against SKU settings has to go through here to pick up codes
 * a SKU was renamed away from.
 */
export const loadSkuCatalog = async (
	prisma: Prisma.TransactionClient
): Promise<SkuCatalog> => {
	const settings = await prisma.skuSetting.findMany({
		select: {
			id: true,
			sku: true,
			title: true,
			aliases: { select: { sku: true } },
		},
	});

	const byKey = new Map<string, SkuCatalogEntry>();
	const codesById = new Map<string, string[]>();
	const entries: SkuCatalogEntry[] = [];

	for (const setting of settings) {
		const entry = { id: setting.id, sku: setting.sku, title: setting.title };
		entries.push(entry);
		codesById.set(setting.id, [
			setting.sku,
			...setting.aliases.map((a) => a.sku),
		]);
		for (const alias of setting.aliases) {
			if (!byKey.has(skuKey(alias.sku))) byKey.set(skuKey(alias.sku), entry);
		}
	}
	for (const entry of entries) byKey.set(skuKey(entry.sku), entry);

	const resolve = (sku: string | null | undefined) =>
		sku?.trim() ? (byKey.get(skuKey(sku)) ?? null) : null;

	return {
		resolve,
		canonical: (sku) => resolve(sku)?.sku ?? sku.trim(),
		expand: (skus) => [
			...new Set(
				skus.flatMap((sku) => {
					const entry = resolve(sku);
					return entry ? [sku, ...(codesById.get(entry.id) ?? [])] : [sku];
				})
			),
		],
	};
};
