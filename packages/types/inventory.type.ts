import { ProductionRun } from '@repo/db';
import type { KitOrderStatusEnum } from '@repo/enums';
import { CreateProductionRunSchema } from '@repo/schemas';
import z from 'zod';
import type { InventoryGroupBy } from './filters.type';

export type InventoryLot = {
	lotNumber: string;
	location: string;
	qty: number;
	expirationDate: string | null;
	daysToExpiry: number | null;
};

export type InProductionSource = {
	type: 'run' | 'asn' | 'kit';
	reference: string;
	lot: string | null;
	quantity: number;
	date: string | null;
};

export type InProductionBreakdown = {
	total: number;
	runs: number;
	asns: number;
	kitting: number;
	sources: InProductionSource[];
};

export type InventorySkuRow = {
	sku: string;
	description: string | null;
	onHand: number;
	committed: number;
	available: number;
	backordered: number;
	quarantined: number;
	inProduction: InProductionBreakdown;
	earliestExpiry: string | null;
	lots: InventoryLot[];
};

export type InventoryTotals = {
	onHand: number;
	committed: number;
	available: number;
	backordered: number;
	quarantined: number;
	inProduction: number;
};

export type GetInventoryResponseType = {
	data: InventorySkuRow[];
	totals: InventoryTotals;
};

export type AsnPackage = {
	id: string;
	sku: string | null;
	lot: string | null;
	quantitySent: number;
	quantityReceived: number;
	quantityDamaged: number;
	quantityShelved: number;
};

export type AsnItem = {
	id: string;
	asnNumber: string;
	description: string | null;
	warehouseCode: string | null;
	status: string | null;
	poNumber: string | null;
	sku: string | null;
	externalId: string | null;
	carrier: string | null;
	trackingNumber: string | null;
	expectedDate: string | null;
	actualDate: string | null;
	sent: number;
	received: number;
	damaged: number;
	shelved: number;
	packages: AsnPackage[];
	notes: string | null;
};

export type GetAsnsResponseType = {
	data: AsnItem[];
	totalCount: number;
};

export type GetProductionRunsResponseType = {
	data: ProductionRunType[];
	totalCount: number;
};

export type ProductionRunType = ProductionRun;

export type UpdateProductionRunInput = {
	completed: boolean;
};

export type KitOrderFinalItem = {
	id: string;
	sku: string;
	description: string | null;
	quantity: number;
	quantityBuilt: number;
};

export type KitOrderRawItem = {
	id: string;
	sku: string;
	description: string | null;
	quantity: number;
	quantityReserved: number;
	quantityConsumed: number;
	requiredLotNumber: string | null;
};

export type KitOrderItem = {
	id: string;
	kitOrderNumber: string;
	kitDescription: string | null;
	sku: string | null;
	status: KitOrderStatusEnum;
	workflowStep: string | null;
	warehouse: string | null;
	quantity: number;
	quantityBuilt: number;
	percentComplete: number;
	billableCost: number | null;
	createdDate: string | null;
	requestedDate: string | null;
	completedDate: string | null;
	canceledDate: string | null;
	finalItems: KitOrderFinalItem[];
	rawItems: KitOrderRawItem[];
};

export type GetKitOrdersResponseType = {
	data: KitOrderItem[];
	totalCount: number;
};

export type CreateProductionRunInput = z.infer<
	typeof CreateProductionRunSchema
>;

export type InventoryLocationType = {
	sku: string;
	description: string | null;
	locationId: string;
	locationName: string;
	available: number;
	onHand: number;
	committed: number;
	incoming: number;
	reserved: number;
	damaged: number;
	safetyStock: number;
	qualityControl: number;
};

export type InventoryBreakdownRow = {
	/** SKU code or location name */
	key: string;
	/** Product title or location name */
	label: string;
	onHand: number;
	available: number;
	committed: number;
	/** On hand × current COGS; null when no SKU in the row has a COGS */
	value: number | null;
	/** Percentage of total inventory value */
	valueShare: number | null;
	children?: InventoryBreakdownRow[];
};

export type InventorySummaryTotals = {
	onHand: number;
	available: number;
	committed: number;
	value: number;
};

export type GetInventorySummaryResponseType = {
	totals: InventorySummaryTotals;
	breakdownBy: InventoryGroupBy;
	breakdown: InventoryBreakdownRow[];
};
