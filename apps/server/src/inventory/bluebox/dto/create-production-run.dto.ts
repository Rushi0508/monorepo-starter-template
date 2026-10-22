import { CreateProductionRunInput } from '@repo/types';
import { Type } from 'class-transformer';
import {
	IsDateString,
	IsInt,
	IsNotEmpty,
	IsPositive,
	IsString,
} from 'class-validator';

export class CreateProductionRunDto implements CreateProductionRunInput {
	@IsString()
	@IsNotEmpty()
	sku: string;

	@IsDateString()
	@IsNotEmpty()
	productionDate: string;

	@IsString()
	@IsNotEmpty()
	lotNumber: string;

	@Type(() => Number)
	@IsInt()
	@IsPositive()
	quantity: number;
}
