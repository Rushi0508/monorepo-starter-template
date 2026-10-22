import type {
	FolkCompanyMappingType,
	FolkCustomerOption,
	FolkMappingSummaryType,
	GetFolkGroupsResponseType,
	GetFolkMappingsResponseType,
} from '@repo/types';
import { capWithMeta, omitNulls } from '../../lib/shape.js';
import { CUSTOMER_CAP } from './schema.js';

function shapeMapping(row: FolkCompanyMappingType) {
	return omitNulls({
		id: row.id,
		folkCompanyId: row.folkCompanyId,
		folkCompanyName: row.folkCompanyName,
		folkGroupId: row.folkGroupId,
		status: row.status,
		matchScore: row.matchScore,
		sdCustomerId: row.sdCustomerId,
		pipelineStatus: row.pipelineStatus,
		customerType: row.customerType,
		lastContactAt: row.lastContactAt,
		lastContactType: row.lastContactType,
		customers: row.customers?.map((customer) =>
			omitNulls({
				id: customer.id,
				displayName: customer.displayName,
				saueroCode: customer.saueroCode,
			})
		),
		proposedCustomer: row.proposedCustomer
			? omitNulls({
					id: row.proposedCustomer.id,
					displayName: row.proposedCustomer.displayName,
					saueroCode: row.proposedCustomer.saueroCode,
				})
			: undefined,
	});
}

export function shapeFolkMappings(raw: GetFolkMappingsResponseType) {
	return omitNulls({
		mappings: raw.data.map(shapeMapping),
		totalCount: raw.totalCount,
		page: raw.page,
		limit: raw.limit,
	});
}

export function shapeFolkSummary(raw: FolkMappingSummaryType) {
	return omitNulls({
		pendingReview: raw.PENDING_REVIEW,
		mapped: raw.MAPPED,
		unmapped: raw.UNMAPPED,
		total: raw.total,
	});
}

export function shapeFolkGroups(groups: GetFolkGroupsResponseType) {
	return {
		groups: groups.map((group) =>
			omitNulls({
				folkGroupId: group.folkGroupId,
				name: group.name,
				tracked: group.tracked,
			})
		),
		totalCount: groups.length,
	};
}

export function shapeFolkCustomers(customers: FolkCustomerOption[]) {
	const capped = capWithMeta(customers, CUSTOMER_CAP);
	return omitNulls({
		customers: capped.items.map((customer) =>
			omitNulls({
				id: customer.id,
				displayName: customer.displayName,
				email: customer.email,
			})
		),
		totalCount: customers.length,
		truncated: capped.truncated,
	});
}
