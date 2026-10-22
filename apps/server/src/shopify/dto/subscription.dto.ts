import { IsNotEmpty, IsString } from 'class-validator';

export class SubscriptionDto {
	@IsString()
	@IsNotEmpty()
	contract_id: string;

	@IsString()
	@IsNotEmpty()
	status: string;

	@IsString()
	@IsNotEmpty()
	customer_id: string;

	@IsString()
	@IsNotEmpty()
	next_billing_date: string;
}
