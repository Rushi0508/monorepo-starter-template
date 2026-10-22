export interface ShopifyAddressNodeType {
	id: string;
	firstName: string | null;
	lastName: string | null;
	company: string | null;
	address1: string | null;
	address2: string | null;
	city: string | null;
	province: string | null;
	country: string | null;
	zip: string | null;
	phone: string | null;
	name: string | null;
	provinceCode: string | null;
	countryCode: string | null;
}

export interface ShopifyCustomerNodeType {
	id: string;
	firstName: string | null;
	lastName: string | null;
	defaultEmailAddress: { emailAddress: string | null } | null;
	defaultPhoneNumber: { phoneNumber: string } | null;
	displayName: string;
	state: string;
	note: string | null;
	tags: string[];
	createdAt: string;
	defaultAddress: { id: string } | null;
	addressesV2: { nodes: ShopifyAddressNodeType[] };
}

export interface GetCustomersPageResponseType {
	customers: {
		edges: { node: ShopifyCustomerNodeType }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

export interface GetCustomerByIdResponseType {
	customer: ShopifyCustomerNodeType | null;
}

const CUSTOMER_FIELDS = `
  id
  firstName
  lastName
  defaultEmailAddress {
    emailAddress
  }
  defaultPhoneNumber {
    phoneNumber
  }
  displayName
  state
  note
  tags
  createdAt
  defaultAddress {
    id
  }
  addressesV2(first: 50) {
    nodes {
      id
      firstName
      lastName
      company
      address1
      address2
      city
      province
      country
      zip
      phone
      name
      provinceCode
      countryCode: countryCodeV2
    }
  }
`;

export const GET_CUSTOMERS_PAGE = `
  query GetCustomersPage($cursor: String) {
    customers(first: 250, after: $cursor) {
      edges {
        node {
          ${CUSTOMER_FIELDS}
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_CUSTOMER_BY_ID = `
  query GetCustomerById($id: ID!) {
    customer(id: $id) {
      ${CUSTOMER_FIELDS}
    }
  }
`;

export interface FindCustomerByEmailResponseType {
	customerByIdentifier: { id: string } | null;
}

export const FIND_CUSTOMER_BY_EMAIL = `
  query FindCustomerByEmail($emailAddress: String!) {
    customerByIdentifier(identifier: { emailAddress: $emailAddress }) {
      id
    }
  }
`;

export type CustomerSetVariablesType = {
	identifier?: { email: string };
	input: {
		email?: string;
		firstName: string;
		lastName?: string | null;
		phone?: string | null;
		note?: string | null;
		tags?: string[];
	};
};

export interface CustomerSetResponseType {
	customerSet: {
		customer: { id: string } | null;
		userErrors: { field: string[] | null; message: string }[];
	};
}

export type CustomerAddressCreateVariablesType = {
	customerId: string;
	setAsDefault: boolean;
	address: {
		firstName?: string | null;
		lastName?: string | null;
		company?: string | null;
		address1?: string | null;
		address2?: string | null;
		city?: string | null;
		provinceCode?: string | null;
		countryCode: string;
		zip?: string | null;
		phone?: string | null;
	};
};

export interface CustomerAddressCreateResponseType {
	customerAddressCreate: {
		address: { id: string } | null;
		userErrors: { field: string[] | null; message: string }[];
	};
}

export const CUSTOMER_ADDRESS_CREATE_MUTATION = `
  mutation CustomerAddressCreate($customerId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
    customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: $setAsDefault) {
      address {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CUSTOMER_SET_MUTATION = `
  mutation CustomerSet($identifier: CustomerSetIdentifiers, $input: CustomerSetInput!) {
    customerSet(identifier: $identifier, input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
