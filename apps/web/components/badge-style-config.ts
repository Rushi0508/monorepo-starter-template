import {
	ASNStatusEnum,
	BlueboxWorkflowStatusEnum,
	ChannelEnum,
	DemandPlanStatusEnum,
	FolkMappingStatusEnum,
	FulfillmentStatusEnum,
	KitOrderStatusEnum,
	PaymentStatusEnum,
	ShipmentStatusEnum,
} from '@repo/enums';

export const DANGER_STYLE = 'bg-red-500/10 text-red-600 border-red-200';

export const CHANNEL_STYLES: Record<ChannelEnum, string> = {
	[ChannelEnum.DTC]: 'bg-blue-500/10 text-blue-600 border-blue-200',
	[ChannelEnum.DTC_POS]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[ChannelEnum.AMAZON]: 'bg-orange-500/10 text-orange-600 border-orange-200',
	[ChannelEnum.WS_ECOM]: 'bg-purple-500/10 text-purple-600 border-purple-200',
	[ChannelEnum.WS_DSD]: 'bg-amber-500/10 text-amber-600 border-amber-200',
	[ChannelEnum.WS_CHAINS]: 'bg-pink-500/10 text-pink-600 border-pink-200',
	[ChannelEnum.ALTERNATIVE]: 'bg-teal-500/10 text-teal-600 border-teal-200',
};

export const PAYMENT_STYLES: Record<PaymentStatusEnum, string> = {
	[PaymentStatusEnum.PAID]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[PaymentStatusEnum.REFUNDED]: 'bg-red-500/10 text-red-600 border-red-200',
	[PaymentStatusEnum.PARTIALLY_REFUNDED]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[PaymentStatusEnum.VOIDED]: 'bg-muted text-muted-foreground border-border',
	[PaymentStatusEnum.PENDING]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[PaymentStatusEnum.PARTIALLY_PAID]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[PaymentStatusEnum.AUTHORIZED]:
		'bg-purple-500/10 text-purple-600 border-purple-200',
};

export const FULFILLMENT_STYLES: Record<FulfillmentStatusEnum, string> = {
	[FulfillmentStatusEnum.FULFILLED]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[FulfillmentStatusEnum.UNFULFILLED]:
		'bg-red-500/10 text-red-600 border-red-200',
	[FulfillmentStatusEnum.PARTIALLY_FULFILLED]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[FulfillmentStatusEnum.RESTOCKED]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[FulfillmentStatusEnum.IN_PROGRESS]:
		'bg-blue-500/10 text-blue-600 border-blue-200',
	[FulfillmentStatusEnum.PENDING_FULFILLMENT]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[FulfillmentStatusEnum.ON_HOLD]:
		'bg-muted text-muted-foreground border-border',
	[FulfillmentStatusEnum.OPEN]: 'bg-sky-500/10 text-sky-600 border-sky-200',
	[FulfillmentStatusEnum.SCHEDULED]:
		'bg-purple-500/10 text-purple-600 border-purple-200',
};

export const ASN_STYLES: Record<ASNStatusEnum, string> = {
	[ASNStatusEnum.IMPORTED]: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
	[ASNStatusEnum.RECEIVING]: 'bg-red-500/10 text-red-600 border-red-200',
	[ASNStatusEnum.RECEIVED]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[ASNStatusEnum.UNPACKING]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[ASNStatusEnum.COMPLETED]: 'bg-green-500/10 text-green-600 border-green-200',
	[ASNStatusEnum.NOT_COMPLETED]: 'bg-muted text-muted-foreground border-border',
};

export const KIT_ORDER_STYLES: Record<KitOrderStatusEnum, string> = {
	[KitOrderStatusEnum.OPEN]: 'bg-sky-500/10 text-sky-600 border-sky-200',
	[KitOrderStatusEnum.COMPLETED]:
		'bg-green-500/10 text-green-600 border-green-200',
	[KitOrderStatusEnum.CANCELED]: 'bg-muted text-muted-foreground border-border',
};

export const BLUEBOX_WORKFLOW_STATUS_STYLES: Record<
	BlueboxWorkflowStatusEnum,
	string
> = {
	[BlueboxWorkflowStatusEnum.OPEN]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[BlueboxWorkflowStatusEnum.RECEIVED]:
		'bg-teal-500/10 text-teal-600 border-teal-200',
	[BlueboxWorkflowStatusEnum.HOLD]: 'bg-red-500/10 text-red-600 border-red-200',
	[BlueboxWorkflowStatusEnum.NEEDS_ATTENTION]:
		'bg-rose-500/10 text-rose-600 border-rose-200',
	[BlueboxWorkflowStatusEnum.PICKING]:
		'bg-blue-500/10 text-blue-600 border-blue-200',
	[BlueboxWorkflowStatusEnum.PICKED]:
		'bg-cyan-500/10 text-cyan-600 border-cyan-200',
	[BlueboxWorkflowStatusEnum.PACKING]:
		'bg-purple-500/10 text-purple-600 border-purple-200',
	[BlueboxWorkflowStatusEnum.PACKED]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[BlueboxWorkflowStatusEnum.SHIPPED]:
		'bg-indigo-500/10 text-indigo-600 border-indigo-200',
	[BlueboxWorkflowStatusEnum.DELIVERED]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[BlueboxWorkflowStatusEnum.CANCELLED]:
		'bg-muted text-muted-foreground border-border',
};

export const SHIPMENT_STATUS_STYLES: Record<ShipmentStatusEnum, string> = {
	[ShipmentStatusEnum.SUBMITTED]:
		'bg-slate-500/10 text-slate-600 border-slate-200',
	[ShipmentStatusEnum.CONFIRMED]:
		'bg-blue-500/10 text-blue-600 border-blue-200',
	[ShipmentStatusEnum.LABEL_PURCHASED]:
		'bg-indigo-500/10 text-indigo-600 border-indigo-200',
	[ShipmentStatusEnum.LABEL_PRINTED]:
		'bg-violet-500/10 text-violet-600 border-violet-200',
	[ShipmentStatusEnum.LABEL_VOIDED]:
		'bg-zinc-500/10 text-zinc-600 border-zinc-200',
	[ShipmentStatusEnum.CARRIER_PICKED_UP]:
		'bg-cyan-500/10 text-cyan-600 border-cyan-200',
	[ShipmentStatusEnum.PICKED_UP]: 'bg-sky-500/10 text-sky-600 border-sky-200',
	[ShipmentStatusEnum.IN_TRANSIT]:
		'bg-purple-500/10 text-purple-600 border-purple-200',
	[ShipmentStatusEnum.OUT_FOR_DELIVERY]:
		'bg-orange-500/10 text-orange-600 border-orange-200',
	[ShipmentStatusEnum.ATTEMPTED_DELIVERY]:
		'bg-amber-500/10 text-amber-600 border-amber-200',
	[ShipmentStatusEnum.READY_FOR_PICKUP]:
		'bg-teal-500/10 text-teal-600 border-teal-200',
	[ShipmentStatusEnum.DELIVERED]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
	[ShipmentStatusEnum.FULFILLED]:
		'bg-green-500/10 text-green-600 border-green-200',
	[ShipmentStatusEnum.MARKED_AS_FULFILLED]:
		'bg-lime-500/10 text-lime-600 border-lime-200',
	[ShipmentStatusEnum.DELAYED]:
		'bg-yellow-500/10 text-yellow-600 border-yellow-200',
	[ShipmentStatusEnum.NOT_DELIVERED]:
		'bg-red-500/10 text-red-600 border-red-200',
	[ShipmentStatusEnum.FAILURE]: 'bg-rose-500/10 text-rose-600 border-rose-200',
	[ShipmentStatusEnum.CANCELED]: 'bg-muted text-muted-foreground border-border',
};

export const DEMAND_PLAN_STATUS_STYLES: Record<DemandPlanStatusEnum, string> = {
	[DemandPlanStatusEnum.DRAFT]:
		'bg-amber-500/10 text-amber-600 border-amber-200',
	[DemandPlanStatusEnum.SAVED]: 'bg-sky-500/10 text-sky-600 border-sky-200',
	[DemandPlanStatusEnum.FINAL]:
		'bg-emerald-500/10 text-emerald-600 border-emerald-200',
};

export const FOLK_MAPPING_STATUS_STYLES: Record<FolkMappingStatusEnum, string> =
	{
		PENDING_REVIEW: 'bg-amber-500/10 text-amber-700 border-amber-200',
		MAPPED: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
		UNMAPPED: 'bg-muted text-muted-foreground border-muted',
	};
