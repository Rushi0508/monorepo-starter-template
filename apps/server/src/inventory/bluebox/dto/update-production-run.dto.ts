import { UpdateProductionRunInput } from '@repo/types';
import { IsBoolean } from 'class-validator';

export class UpdateProductionRunDto implements UpdateProductionRunInput {
	@IsBoolean()
	completed: boolean;
}
