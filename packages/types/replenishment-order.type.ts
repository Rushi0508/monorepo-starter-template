import { ReplenishmentOrder, ReplenishmentOrderItem } from '@repo/db';
import { CreateReplenishmentOrderSchema } from '@repo/schemas';
import z from 'zod';

export type ReplenishmentOrderItemType = ReplenishmentOrderItem;

export type ReplenishmentOrderType = ReplenishmentOrder & {
	items: ReplenishmentOrderItemType[];
};

export type ReplenishmenOrdersResponseType = (ReplenishmentOrderType & {
	blueboxStatus: string;
	pickupDate: Date | string;
	isBlueboxCancelled: boolean;
})[];

export type CreateReplenishmentOrderInput = z.infer<
	typeof CreateReplenishmentOrderSchema
>;
