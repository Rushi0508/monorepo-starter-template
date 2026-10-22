import { UpdateConfigurationInput } from '@repo/types';
import { Transform, Type } from 'class-transformer';
import {
	IsEmail,
	IsInt,
	IsOptional,
	IsString,
	Matches,
	Min,
} from 'class-validator';

export class UpdateConfigurationDto implements UpdateConfigurationInput {
	@IsInt()
	@Min(1)
	@Type(() => Number)
	d2cMaxTransitDays: number;

	@IsInt()
	@Min(1)
	@Type(() => Number)
	b2bMaxTransitDays: number;

	@IsOptional()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value
	)
	@IsEmail()
	@IsString()
	mbDistributorEmail: string | null;

	@IsOptional()
	@IsString()
	@Matches(
		/^([^@\s,]+@[^@\s,]+\.[^@\s,]+)(\s*,\s*[^@\s,]+@[^@\s,]+\.[^@\s,]+)*$/,
		{ message: 'CC must be comma-separated valid emails' }
	)
	mbDistributorCcEmails: string | null;
}
