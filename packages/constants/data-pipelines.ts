export const DATA_PIPELINES = [
	{
		name: 'shopify-orders',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 2 hours',
		description:
			'Syncs Shopify orders, line items, refunds, and fulfillments (reconciliation)',
	},
	{
		name: 'shopify-products',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Daily 12 AM ET',
		description: 'Full sync of Shopify products and variants',
	},
	{
		name: 'shopify-customers',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Daily 10 PM ET',
		description: 'Full sync of Shopify customers and addresses',
	},
	{
		name: 'shopify-orders-realtime',
		source: 'SHOPIFY',
		cadenceType: 'REAL_TIME',
		cadence: null,
		description:
			'Real-time order webhooks via EventBridge/SQS (create, update, cancel, fulfill, paid)',
	},
	{
		name: 'shopify-refunds-realtime',
		source: 'SHOPIFY',
		cadenceType: 'REAL_TIME',
		cadence: null,
		description: 'Real-time refund webhooks via EventBridge/SQS',
	},
	{
		name: 'shopify-fulfillments-realtime',
		source: 'SHOPIFY',
		cadenceType: 'REAL_TIME',
		cadence: null,
		description: 'Real-time fulfillment webhooks via EventBridge/SQS',
	},
	{
		name: 'shopify-subscriptions-realtime',
		source: 'SHOPIFY',
		cadenceType: 'REAL_TIME',
		cadence: null,
		description: 'Real-time subscription webhooks via Shopify Flow',
	},
	{
		name: 'bluebox-orders',
		source: 'BLUEBOX',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 4 hours',
		description:
			'Syncs BlueBox orders, delivery status, and AfterShip checkpoints',
	},
	{
		name: 'bluebox-shipments',
		source: 'BLUEBOX',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 5 hours',
		description: 'Syncs BlueBox outbound shipments and constituent orders',
	},
	{
		name: 'bluebox-inventory',
		source: 'BLUEBOX',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 7 hours',
		description: 'Full sync of warehouse inventory levels by SKU and lot',
	},
	{
		name: 'bluebox-asns',
		source: 'BLUEBOX',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 7 hours',
		description: 'Syncs Advance Shipment Notices and ASN items',
	},
	{
		name: 'bluebox-kit-orders',
		source: 'BLUEBOX',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 4 hours',
		description:
			'Syncs iDrive kitting orders with their component and finished kit quantities',
	},
	{
		name: 'qbo-sync',
		source: 'QBO',
		cadenceType: 'SCHEDULED',
		cadence: 'Daily 9 AM ET',
		description: 'Syncs QBO journal entries, bills, invoices, and payments',
	},
	{
		name: 'shopify-inventory',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 4 hours',
		description:
			'Full sync of Shopify locations, inventory items, and inventory levels (multi-location quantities)',
	},
	{
		name: 'shopify-analytics',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 10 hours',
		description:
			'Syncs ShopifyQL analytics snapshots: session trends, conversion rate, and traffic source breakdown',
	},
	{
		name: 'gmail-inbox',
		source: 'GMAIL',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 5 minutes',
		description:
			'Syncs new mail from the connected Gmail inbox: PODs, Pickup requests etc.',
	},
	{
		name: 'demand-actuals',
		source: 'SHOPIFY',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 6 hours',
		description:
			'Rolls Shopify orders into monthly units and net revenue per channel and SKU, the input to every demand forecast',
	},
	{
		name: 'simplydepo-products',
		source: 'SIMPLYDEPO',
		cadenceType: 'SCHEDULED',
		cadence: 'Daily 12 AM ET',
		description: 'Full sync of SimplyDepo product catalog via Zapier',
	},
	{
		name: 'folk-metrics-push',
		source: 'FOLK',
		cadenceType: 'SCHEDULED',
		cadence: 'Every 2 hours',
		description:
			'Pushes order metrics (last order, value, cases, 90-day average, lifetime revenue and orders etc.) to mapped Folk companies',
	},
	{
		name: 'folk-webhooks-realtime',
		source: 'FOLK',
		cadenceType: 'REAL_TIME',
		cadence: null,
		description:
			'Real-time Folk company webhooks (created, updated, deleted, groups_updated)',
	},
	{
		name: 'folk-nightly-reconcile',
		source: 'FOLK',
		cadenceType: 'SCHEDULED',
		cadence: 'Daily 1 AM ET',
		description:
			'Re-seeds tracked group mappings, creates Shopify customers, recomputes metrics, and syncs last contact from interactions',
	},
] as const;

export type DataPipelineConfig = (typeof DATA_PIPELINES)[number];
export type DataPipelineName = DataPipelineConfig['name'];
