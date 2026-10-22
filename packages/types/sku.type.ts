import {
	SkuChannelFulfillmentCost,
	SkuChannelPrice,
	SkuCogs,
	SkuColumn,
	SkuMsrp,
	SkuSetting,
} from '@repo/db';
import {
	CreateSkuChannelFulfillmentCostSchema,
	CreateSkuChannelPriceSchema,
	CreateSkuCogsSchema,
	CreateSkuMsrpSchema,
	CreateSkuSettingSchema,
} from '@repo/schemas';
import { z } from 'zod';

export type SkuOptionType = {
	id: string;
	sku: string;
	title: string;
	/**
	 * The "Unit Type" custom column, e.g. "Distribution Unit (DU)". Null when the
	 * column does not exist or the SKU has no value for it. Callers match on it
	 * loosely — it is user-entered text, not an enum.
	 */
	unitType: string | null;
};

export type SkuOptionsFilterType = {
	status?: 'active';
	connectedTo?: 'shopify' | 'bluebox';
};

export type SkuColumnType = SkuColumn;

/** Which catalogs contain this SKU. */
export type SkuChannelPresence = {
	shopify: boolean;
	bluebox: boolean;
	simplydepo: boolean;
};

export type SkuSettingType = SkuSetting & {
	cogs?: SkuCogsType[] | null;
	channelFulfillmentCosts?: SkuChannelFulfillmentCostType[] | null;
	channelPrices?: SkuChannelPriceType[] | null;
	msrps?: SkuMsrpType[] | null;
};

export type SkuCogsType = SkuCogs;
export type SkuChannelFulfillmentCostType = SkuChannelFulfillmentCost;
export type SkuChannelPriceType = SkuChannelPrice;
export type SkuMsrpType = SkuMsrp;

export type GetSkuSettingsResponseType = {
	data: (SkuSettingType & { channels: SkuChannelPresence })[];
	columns: SkuColumnType[];
};

export type UpdateSkuSettingsInput = {
	updates: {
		sku: string;
		customFields: Record<string, string>;
	}[];
};

export type CreateSkuColumnInput = {
	name: string;
};

export type ReorderSkuColumnsInput = {
	orderedIds: string[];
};

export type CreateSkuSettingInput = z.infer<typeof CreateSkuSettingSchema>;

export type SkuCheckResult = {
	existsInShopify: boolean;
	existsInBluebox: boolean;
	existsInSimplyDepo: boolean;
	existsInSettings: boolean;
};

export type CreateSkuCogsInput = z.infer<typeof CreateSkuCogsSchema>;

export type CreateSkuChannelFulfillmentCostInput = z.infer<
	typeof CreateSkuChannelFulfillmentCostSchema
>;

export type CreateSkuChannelPriceInput = z.infer<
	typeof CreateSkuChannelPriceSchema
>;

export type CreateSkuMsrpInput = z.infer<typeof CreateSkuMsrpSchema>;
