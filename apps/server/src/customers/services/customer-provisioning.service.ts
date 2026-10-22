import {
	BadRequestException,
	ConflictException,
	Injectable,
} from '@nestjs/common';
import type { ShopifyCustomer } from '@repo/db';
import type { CreateCustomerInput } from '@repo/types';
import {
	CUSTOMER_ADDRESS_CREATE_MUTATION,
	CUSTOMER_SET_MUTATION,
	type CustomerAddressCreateResponseType,
	type CustomerAddressCreateVariablesType,
	type CustomerSetResponseType,
	type CustomerSetVariablesType,
	FIND_CUSTOMER_BY_EMAIL,
	type FindCustomerByEmailResponseType,
} from 'src/shopify/queries/customer.queries';
import { ShopifyGraphqlClient } from 'src/shopify/shopify-graphql.client';
import { ShopifyCustomerSyncService } from 'src/shopify/sync/services/shopify-customer-sync.service';
import { extractShopifyId } from 'src/shopify/utils/shopify-id.utils';

export type CustomerSource = 'manual' | 'folk';

const SOURCE_TAGS: Record<CustomerSource, string[]> = {
	manual: ['Created-Sauerobase'],
	folk: ['Folk-Sauerobase', 'B2B', 'wholesale'],
};

export type ProvisionCustomerInput = {
	firstName: string;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	note?: string | null;
	/** Any part may be missing; Shopify accepts a partial address. */
	address?: {
		company?: string | null;
		address1?: string | null;
		address2?: string | null;
		city?: string | null;
		provinceCode?: string | null;
		zip?: string | null;
		countryCode: string;
	} | null;
};

const orNull = (value: string | null | undefined) => value?.trim() || null;

@Injectable()
export class CustomerProvisioningService {
	constructor(
		private readonly shopifyClient: ShopifyGraphqlClient,
		private readonly customerSync: ShopifyCustomerSyncService
	) {}

	async createCustomer(input: CreateCustomerInput) {
		const { created } = await this.ensureShopifyCustomer(
			{
				firstName: input.firstName,
				lastName: input.lastName,
				email: input.email,
				phone: input.phone,
				note: input.note,
				address: {
					company: input.company,
					address1: input.address1,
					address2: input.address2,
					city: input.city,
					provinceCode: input.provinceCode,
					zip: input.zip,
					countryCode: 'US',
				},
			},
			'manual'
		);
		if (!created) {
			throw new ConflictException(
				'A customer with this email already exists in Shopify.'
			);
		}
		return { message: 'Customer created in Shopify' };
	}

	/**
	 * Shopify is the customer master: the customer is created there and the
	 * record is pulled straight back through the customer sync, so our row is
	 * always Shopify's version. An existing Shopify customer with the same email
	 * is left untouched and returned with created: false. Without an email there
	 * is nothing to match on, so a new customer is always created.
	 */
	async ensureShopifyCustomer(
		input: ProvisionCustomerInput,
		source: CustomerSource
	): Promise<{ customer: ShopifyCustomer; created: boolean }> {
		const email = input.email?.trim().toLowerCase() || undefined;

		if (email) {
			const { customerByIdentifier: existing } =
				await this.shopifyClient.request<FindCustomerByEmailResponseType>(
					FIND_CUSTOMER_BY_EMAIL,
					{ emailAddress: email }
				);
			if (existing) {
				return {
					customer: await this.pullBack(existing.id),
					created: false,
				};
			}
		}

		const phone = orNull(input.phone);
		const { customerSet } = await this.shopifyClient.request<
			CustomerSetResponseType,
			CustomerSetVariablesType
		>(CUSTOMER_SET_MUTATION, {
			identifier: email ? { email } : undefined,
			input: {
				email,
				firstName: input.firstName.trim(),
				lastName: orNull(input.lastName),
				phone,
				note: orNull(input.note),
				tags: SOURCE_TAGS[source],
			},
		});

		if (customerSet.userErrors.length || !customerSet.customer) {
			throw new BadRequestException(
				`Shopify rejected the customer: ${customerSet.userErrors
					.map((e) => e.message)
					.join('; ')}`
			);
		}

		const customerId = customerSet.customer.id;
		const addressErrors = input.address
			? await this.createDefaultAddress(customerId, input, phone)
			: [];

		const customer = await this.pullBack(customerId);

		if (addressErrors.length) {
			throw new BadRequestException(
				`The customer was created in Shopify, but Shopify rejected the delivery address: ${addressErrors.join('; ')}. Add the address to the customer in Shopify.`
			);
		}

		return { customer, created: true };
	}

	private async createDefaultAddress(
		customerId: string,
		input: ProvisionCustomerInput,
		phone: string | null
	): Promise<string[]> {
		const address = input.address;
		if (!address) return [];

		const { customerAddressCreate } = await this.shopifyClient.request<
			CustomerAddressCreateResponseType,
			CustomerAddressCreateVariablesType
		>(CUSTOMER_ADDRESS_CREATE_MUTATION, {
			customerId,
			setAsDefault: true,
			address: {
				firstName: input.firstName.trim(),
				lastName: orNull(input.lastName),
				company: orNull(address.company),
				address1: orNull(address.address1),
				address2: orNull(address.address2),
				city: orNull(address.city),
				provinceCode: orNull(address.provinceCode),
				zip: orNull(address.zip),
				countryCode: address.countryCode,
				phone,
			},
		});

		if (
			customerAddressCreate.address &&
			!customerAddressCreate.userErrors.length
		) {
			return [];
		}
		return customerAddressCreate.userErrors.length
			? customerAddressCreate.userErrors.map((e) => e.message)
			: ['no address was returned'];
	}

	private async pullBack(gid: string): Promise<ShopifyCustomer> {
		const customer = await this.customerSync.fetchAndUpsertByShopifyId(
			extractShopifyId(gid)
		);
		if (!customer) {
			throw new BadRequestException(
				'Customer was saved in Shopify but could not be read back. It will appear after the next customer sync.'
			);
		}
		return customer;
	}
}
