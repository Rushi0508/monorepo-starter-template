export interface ShopifyVariantNodeType {
	id: string;
	sku: string | null;
	barcode: string | null;
	price: string;
	title: string;
	inventoryQuantity: number | null;
	createdAt: string;
}

export interface ShopifyProductNodeType {
	id: string;
	title: string;
	vendor: string;
	productType: string;
	status: string;
	tags: string[];
	createdAt: string;
	variants: { edges: { node: ShopifyVariantNodeType }[] };
}

export interface GetProductsPageResponseType {
	products: {
		edges: { node: ShopifyProductNodeType }[];
		pageInfo: { hasNextPage: boolean; endCursor: string | null };
	};
}

export interface GetProductByIdResponseType {
	product: ShopifyProductNodeType | null;
}

export const GET_PRODUCTS_PAGE = `
  query GetProductsPage($cursor: String) {
    products(first: 250, after: $cursor) {
      edges {
        node {
          id
          title
          vendor
          productType
          status
          tags
          createdAt
          variants(first: 100) {
            edges {
              node {
                id
                sku
                barcode
                price
                title
                inventoryQuantity
                createdAt
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

export const GET_PRODUCT_BY_ID = `
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      title
      vendor
      productType
      status
      tags
      createdAt
      variants(first: 100) {
        edges {
          node {
            id
            sku
            barcode
            price
            title
            inventoryQuantity
            createdAt
          }
        }
      }
    }
  }
`;

export type ShopifyProductStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'UNLISTED';

export interface ShopifyVariantBySkuNodeType {
	id: string;
	sku: string | null;
	title: string;
	inventoryQuantity: number | null;
	inventoryItem: { tracked: boolean };
	product: { title: string; status: ShopifyProductStatus; tags: string[] };
}

export interface FindVariantsBySkuResponseType {
	productVariants: { nodes: ShopifyVariantBySkuNodeType[] };
}

export type FindVariantsBySkuVariablesType = {
	query: string;
};

export const FIND_VARIANTS_BY_SKU = `
  query FindVariantsBySku($query: String!) {
    productVariants(first: 250, query: $query) {
      nodes {
        id
        sku
        title
        inventoryQuantity
        inventoryItem {
          tracked
        }
        product {
          title
          status
          tags
        }
      }
    }
  }
`;
