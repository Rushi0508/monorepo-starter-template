import { ChannelEnum } from '@repo/enums';
import {
	CreateSkuChannelFulfillmentCostInput,
	CreateSkuChannelPriceInput,
	CreateSkuCogsInput,
	CreateSkuMsrpInput,
} from '@repo/types';
import { Type } from 'class-transformer';
import {
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	Min,
} from 'class-validator';

export class CreateSkuCogsDto implements CreateSkuCogsInput {
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	materials: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	production: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	shipping: number;

	@IsDateString()
	@IsNotEmpty()
	effectiveFrom: string;
}

export class CreateSkuChannelFulfillmentCostDto
	implements CreateSkuChannelFulfillmentCostInput
{
	@IsEnum(ChannelEnum)
	channel: ChannelEnum;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	storage: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	pick: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	pack: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	shipping: number;

	@IsDateString()
	@IsNotEmpty()
	effectiveFrom: string;
}

export class CreateSkuChannelPriceDto implements CreateSkuChannelPriceInput {
	@IsEnum(ChannelEnum)
	channel: ChannelEnum;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	amount: number;

	@IsDateString()
	@IsNotEmpty()
	effectiveFrom: string;
}

export class CreateSkuMsrpDto implements CreateSkuMsrpInput {
	@Type(() => Number)
	@IsNumber()
	@Min(0)
	amount: number;

	@IsDateString()
	@IsNotEmpty()
	effectiveFrom: string;
}
