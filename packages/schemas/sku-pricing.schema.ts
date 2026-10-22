import { ChannelEnum } from '@repo/enums';
import { z } from 'zod';
import { RequiredDateSchema } from './common.schema';

const AmountSchema = z
	.number('Amount is required')
	.min(0, 'Amount must be 0 or greater');

const ChannelSchema = z.enum(ChannelEnum, 'Channel is required');

/*
 * Costs are entered as their parts; each total is derived server-side so a
 * stored version can never disagree with its own breakdown.
 */

/** Cost of goods for one unit — the same in every channel. */
export const CreateSkuCogsSchema = z.object({
	materials: AmountSchema,
	production: AmountSchema,
	shipping: AmountSchema,
	effectiveFrom: RequiredDateSchema,
});

/** Cost to fulfill one unit through a channel. */
export const CreateSkuChannelFulfillmentCostSchema = z.object({
	channel: ChannelSchema,
	storage: AmountSchema,
	pick: AmountSchema,
	pack: AmountSchema,
	shipping: AmountSchema,
	effectiveFrom: RequiredDateSchema,
});

export const CreateSkuChannelPriceSchema = z.object({
	channel: ChannelSchema,
	amount: AmountSchema,
	effectiveFrom: RequiredDateSchema,
});

export const CreateSkuMsrpSchema = z.object({
	amount: AmountSchema,
	effectiveFrom: RequiredDateSchema,
});
