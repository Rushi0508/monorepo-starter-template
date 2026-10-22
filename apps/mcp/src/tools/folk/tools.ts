import type {
	FolkCustomerOption,
	FolkMappingSummaryType,
	GetFolkGroupsResponseType,
	GetFolkMappingsResponseType,
} from '@repo/types';
import type { ToolDef } from '../types.js';
import { type FolkInput, type FolkView, folkInputSchema } from './schema.js';
import {
	shapeFolkCustomers,
	shapeFolkGroups,
	shapeFolkMappings,
	shapeFolkSummary,
} from './shape.js';

function definedParams(
	params: Record<string, unknown>
): Record<string, unknown> | undefined {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		out[key] = value;
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

export const folkTool: ToolDef = {
	name: 'get_folk',
	description:
		'Folk CRM company-to-Shopify-customer mappings: review queue, status counts, tracked groups, and customer search. Use to see which Folk companies are mapped, pending, or unmapped. Not for customer LTV (get_customers) or changing links. Default view=mappings. Customer search needs at least 3 characters. Read-only.',
	inputSchema: folkInputSchema,
	handler: async (client, input) => {
		const parsed = input as FolkInput;
		const view: FolkView = parsed.view ?? 'mappings';

		if (view === 'summary') {
			const summary = await client.get<FolkMappingSummaryType>(
				'/api/folk/mappings/summary'
			);
			return shapeFolkSummary(summary);
		}

		if (view === 'groups') {
			const groups =
				await client.get<GetFolkGroupsResponseType>('/api/folk/groups');
			return shapeFolkGroups(groups);
		}

		if (view === 'customers') {
			const customers = await client.get<FolkCustomerOption[]>(
				'/api/folk/customers',
				definedParams({
					search: parsed.search,
					excludeMappingId: parsed.excludeMappingId,
				})
			);
			return shapeFolkCustomers(customers);
		}

		const mappings = await client.get<GetFolkMappingsResponseType>(
			'/api/folk/mappings',
			definedParams({
				search: parsed.search,
				status: parsed.status,
				page: parsed.page,
				limit: parsed.limit,
			})
		);
		return shapeFolkMappings(mappings);
	},
};
