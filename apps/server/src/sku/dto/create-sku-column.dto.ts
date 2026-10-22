import { PartialType } from '@nestjs/swagger';
import { CreateSkuColumnInput } from '@repo/types';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSkuColumnDto implements CreateSkuColumnInput {
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@IsNotEmpty()
	name: string;
}

export class UpdateSkuColumnDto extends PartialType(CreateSkuColumnDto) {}
