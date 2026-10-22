import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class UpdateUserDto {
	@Trim()
	@IsString()
	@IsNotEmpty()
	name: string;
}
