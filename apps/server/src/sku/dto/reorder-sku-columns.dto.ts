import { ReorderSkuColumnsInput } from '@repo/types';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReorderSkuColumnsDto implements ReorderSkuColumnsInput {
	@IsArray()
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	orderedIds: string[];
}
