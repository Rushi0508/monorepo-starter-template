// ─── ShopifyQL query strings ──────────────────────────────────────────────────
//
// `shopifyqlQuery` lives on the Query type (not Mutation).
// Docs: https://shopify.dev/docs/api/admin-graphql/latest/queries/shopifyqlquery

export const SHOPIFYQL_OPERATION = `
  query ShopifyQLQuery($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns {
          name
          dataType
          displayName
        }
        rows
      }
      parseErrors
    }
  }
`;

// Daily sessions + conversion rate, refreshed over a short trailing window
export const SESSIONS_DAILY_QUERY = `
  FROM sessions
  SHOW sessions, conversion_rate, sessions_that_completed_checkout
  TIMESERIES day
  SINCE -3d
  UNTIL today
`;

// Daily sessions split by traffic source × device (channel×device matrix)
export const SESSIONS_CHANNEL_DEVICE_QUERY = `
  FROM sessions
  SHOW sessions, sessions_that_completed_checkout
  GROUP BY referring_channel, session_device_type
  TIMESERIES day
  SINCE -3d
  UNTIL today
  ORDER BY sessions DESC
`;

// ─── Response Types ────────────────────────────────────────────────────────────

export interface ShopifyQLColumn {
	name: string;
	dataType: string;
	displayName: string;
}

export interface ShopifyQLTableData {
	columns: ShopifyQLColumn[];
	rows: Record<string, string | null>[];
}

export interface ShopifyQLQueryResult {
	tableData: ShopifyQLTableData | null;
	parseErrors: string[] | null;
}

export interface ShopifyQLQueryResponse {
	shopifyqlQuery: ShopifyQLQueryResult;
}

// ─── Parsed row shape per metric ──────────────────────────────────────────────

export interface SessionsDailyRow {
	[key: string]: unknown;
	day: string; // YYYY-MM-DD
	sessions: number;
	conversion_rate: number | null;
	sessions_that_completed_checkout: number | null;
}

export interface SessionsChannelDeviceRow {
	[key: string]: unknown;
	day: string; // YYYY-MM-DD
	referring_channel: string | null;
	session_device_type: string | null;
	sessions: number;
	sessions_that_completed_checkout: number | null;
}
