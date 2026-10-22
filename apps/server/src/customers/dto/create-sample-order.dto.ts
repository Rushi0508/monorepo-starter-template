import { ApiProperty } from '@nestjs/swagger';
import { MAX_SAMPLE_ORDER_CUSTOMERS } from '@repo/constants';
import type { CreateSampleOrdersInput } from '@repo/types';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested,
} from 'class-validator';

export class SampleOrderItemDto {
	@ApiProperty({ example: 'SAU-SL-12-1CAN' })
	@IsString()
	@IsNotEmpty()
	sku: string;

	@ApiProperty({ example: 2, minimum: 1 })
	@IsInt()
	@Min(1)
	quantity: number;
}

export class CreateSampleOrdersDto implements CreateSampleOrdersInput {
	@ApiProperty({ type: [String], maxItems: MAX_SAMPLE_ORDER_CUSTOMERS })
	@IsUUID('all', { each: true })
	@ArrayMinSize(1)
	@ArrayMaxSize(MAX_SAMPLE_ORDER_CUSTOMERS)
	customerIds: string[];

	@ApiProperty({ type: [SampleOrderItemDto] })
	@ValidateNested({ each: true })
	@Type(() => SampleOrderItemDto)
	@ArrayMinSize(1)
	items: SampleOrderItemDto[];

	@ApiProperty({ required: false, description: 'Shopify order note' })
	@IsOptional()
	@IsString()
	note?: string;

	@ApiProperty({ type: [String] })
	@IsArray()
	@IsString({ each: true })
	tags: string[];
}
