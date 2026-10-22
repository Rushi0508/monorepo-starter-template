import { configurationTool } from './configuration/index.js';
import { customersTool } from './customers/index.js';
import { dashboardTool } from './dashboard/index.js';
import { dataPipelineTool } from './data-pipeline/index.js';
import { demandPlanningTool } from './demand-planning/index.js';
import { docsTool } from './docs/index.js';
import { folkTool } from './folk/index.js';
import { fulfillmentTool } from './fulfillment/index.js';
import { inventoryTool } from './inventory/index.js';
import { ordersTool } from './orders/index.js';
import { podTool } from './pod/index.js';
import { revenueTool } from './revenue/index.js';
import { skuTool } from './sku/index.js';
import type { ToolDef } from './types.js';
import { usersTool } from './users/index.js';

export type { ToolDef } from './types.js';

/**
 * Every tool the MCP server exposes. Each entry costs tokens in the model's
 * context on every request, so add one only when it earns its place.
 */
export const tools: ToolDef[] = [
	docsTool,
	dashboardTool,
	ordersTool,
	fulfillmentTool,
	inventoryTool,
	demandPlanningTool,
	podTool,
	revenueTool,
	customersTool,
	dataPipelineTool,
	folkTool,
	skuTool,
	configurationTool,
	usersTool,
];
