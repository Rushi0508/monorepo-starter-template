import { ApiProperty } from '@nestjs/swagger';
import { CreateReplenishmentOrderInput } from '@repo/types';
import { Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';

export class ReplenishmentOrderItemDto {
	@ApiProperty({ example: 'SAU-SL-12-1CAN' })
	@IsString()
	@IsNotEmpty()
	sku: string;

	@ApiProperty({ example: 50, minimum: 1 })
	@IsInt()
	@Min(1)
	quantity: number;
}

export class CreateReplenishmentOrderDto
	implements CreateReplenishmentOrderInput
{
	@ApiProperty({ type: [ReplenishmentOrderItemDto] })
	@ValidateNested({ each: true })
	@Type(() => ReplenishmentOrderItemDto)
	@ArrayMinSize(1)
	items: ReplenishmentOrderItemDto[];

	@ApiProperty({
		example: true,
		description: 'Email the pickup request to Manuel Brothers',
	})
	@IsBoolean()
	sendPickupEmail: boolean;
}
