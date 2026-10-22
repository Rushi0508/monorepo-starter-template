import { PartialType } from '@nestjs/swagger';
import { CreateSkuSettingInput } from '@repo/types';
import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateSkuSettingDto implements CreateSkuSettingInput {
	@Trim()
	@IsString()
	@IsNotEmpty()
	sku: string;

	@Trim()
	@IsString()
	@IsNotEmpty()
	title: string;
}

export class UpdateSkuSettingDto extends PartialType(CreateSkuSettingDto) {}
