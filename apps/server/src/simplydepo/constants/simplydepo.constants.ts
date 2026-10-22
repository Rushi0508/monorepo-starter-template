/** SimplyDepo app slug in Zapier. */
export const SIMPLYDEPO_APP = 'simplydepo';

/** Create Fulfillment delivery_method (Zapier SELECT). */
export const SIMPLYDEPO_DELIVERY_METHOD = 'LOCAL_DELIVERY';

/** Create Fulfillment deliverer_name — must match a SimplyDepo "Fulfill by" user. */
export const SIMPLYDEPO_DELIVERER_NAME = 'Mark Sundman';

export type ZapierActionType = 'read' | 'search' | 'write';

/** Zapier action keys for SimplyDepo. */
export const SIMPLYDEPO_ACTIONS = {
	getProducts: {
		actionType: 'read' as const satisfies ZapierActionType,
		action: 'get_products',
	},
	findOrder: {
		actionType: 'search' as const satisfies ZapierActionType,
		action: 'find_order',
	},
	createFulfillment: {
		actionType: 'write' as const satisfies ZapierActionType,
		action: 'create_fulfillment',
	},
	generateOrderPdf: {
		actionType: 'write' as const satisfies ZapierActionType,
		action: 'generate_order_pdf',
	},
};
