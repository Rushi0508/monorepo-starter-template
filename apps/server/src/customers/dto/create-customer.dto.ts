import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateCustomerInput } from '@repo/types';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto implements CreateCustomerInput {
	@ApiProperty({ example: 'Jane' })
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@ApiProperty({ example: 'Doe' })
	@IsString()
	@IsNotEmpty()
	lastName: string;

	@ApiPropertyOptional({ example: 'jane@example.com' })
	@Transform(({ value }) => value?.trim() || undefined)
	@IsEmail()
	@IsOptional()
	email?: string;

	@ApiPropertyOptional({ example: '+15205550123' })
	@IsString()
	@IsOptional()
	phone?: string;

	@ApiPropertyOptional({ example: 'Sonoran House' })
	@IsString()
	@IsOptional()
	company?: string;

	@ApiProperty({ example: '123 Main St' })
	@IsString()
	@IsNotEmpty()
	address1: string;

	@ApiPropertyOptional({ example: 'Suite 4' })
	@IsString()
	@IsOptional()
	address2?: string;

	@ApiProperty({ example: 'Tucson' })
	@IsString()
	@IsNotEmpty()
	city: string;

	@ApiProperty({ example: 'AZ' })
	@IsString()
	@IsNotEmpty()
	provinceCode: string;

	@ApiProperty({ example: '85701' })
	@IsString()
	@IsNotEmpty()
	zip: string;

	@ApiPropertyOptional({ example: 'Deliveries at the back door, 8am–2pm' })
	@IsString()
	@IsOptional()
	note?: string;
}
