import { PartialType } from '@nestjs/swagger';
import { CreateUserInput } from '@repo/types';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateUserDto implements CreateUserInput {
	@Trim()
	@IsString()
	@IsNotEmpty()
	name: string;

	@Trim()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase().trim() : value
	)
	@IsEmail()
	@IsNotEmpty()
	email: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
