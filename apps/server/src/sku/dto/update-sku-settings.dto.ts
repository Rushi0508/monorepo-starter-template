import { UpdateSkuSettingsInput } from '@repo/types';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsObject,
	IsString,
	ValidateNested,
} from 'class-validator';

export class SkuSettingUpdateItemDto {
	@IsString()
	@IsNotEmpty()
	sku: string;

	@IsObject()
	customFields: Record<string, string>;
}

export class UpdateSkuSettingsDto implements UpdateSkuSettingsInput {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SkuSettingUpdateItemDto)
	updates: SkuSettingUpdateItemDto[];
}
