// ── Response types ───────────────────────────────────────────────────────────

export interface ShopifyLocationNodeType {
	id: string;
	name: string;
	isActive: boolean;
	address: {
		address1: string | null;
		address2: string | null;
		city: string | null;
		province: string | null;
		country: string | null;
		zip: string | null;
	};
}

export interface GetLocationsPageResponseType {
	locations: {
		edges: { node: ShopifyLocationNodeType }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

export interface ShopifyInventoryQuantityType {
	name: string;
	quantity: number;
}

export interface ShopifyInventoryLevelNodeType {
	id: string;
	quantities: ShopifyInventoryQuantityType[];
	updatedAt: string | null;
	location: { id: string };
}

export interface ShopifyInventoryItemNodeType {
	id: string;
	sku: string | null;
	tracked: boolean;
	unitCost: { amount: string; currencyCode: string } | null;
	inventoryLevels: {
		edges: { node: ShopifyInventoryLevelNodeType }[];
	};
}

export interface GetInventoryItemsPageResponseType {
	inventoryItems: {
		edges: { node: ShopifyInventoryItemNodeType }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

// ── GraphQL queries ─────────────────────────────────────────────────────────

export const GET_LOCATIONS_PAGE = `
  query GetLocationsPage($cursor: String) {
    locations(first: 250, after: $cursor, includeInactive: true) {
      edges {
        node {
          id
          name
          isActive
          address {
            address1
            address2
            city
            province
            country
            zip
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const QUANTITY_NAMES = `["available", "on_hand", "committed", "incoming", "reserved", "damaged", "safety_stock", "quality_control"]`;

export const GET_INVENTORY_ITEMS_PAGE = `
  query GetInventoryItemsPage($cursor: String) {
    inventoryItems(first: 250, after: $cursor) {
      edges {
        node {
          id
          sku
          tracked
          unitCost {
            amount
            currencyCode
          }
          inventoryLevels(first: 50) {
            edges {
              node {
                id
                quantities(names: ${QUANTITY_NAMES}) {
                  name
                  quantity
                }
                updatedAt
                location {
                  id
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

export type InventoryAdjustQuantitiesVariablesType = {
	input: {
		name: 'available';
		reason: string;
		referenceDocumentUri?: string;
		changes: {
			delta: number;
			inventoryItemId: string;
			locationId: string;
			changeFromQuantity: number | null;
		}[];
	};
};

export interface InventoryAdjustQuantitiesResponseType {
	inventoryAdjustQuantities: {
		userErrors: { field: string[] | null; message: string }[];
	};
}

export const INVENTORY_ADJUST_QUANTITIES_MUTATION = `
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        reason
      }
      userErrors {
        field
        message
      }
    }
  }
`;
