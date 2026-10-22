import { FolkCompanyMapping } from '@repo/db';
import type { FolkMappingStatusEnum } from '@repo/enums';
import type { PaginatedResponseType } from './pagination.type';

export type FolkGroupType = {
	folkGroupId: string;
	name: string;
	tracked: boolean;
};

export type GetFolkGroupsResponseType = FolkGroupType[];

export type SetFolkTrackedGroupsInput = {
	folkGroupIds: string[];
};

export type SetFolkTrackedGroupsResultType = {
	groups: FolkGroupType[];
	removedMappings: number;
};

export type FolkMappedCustomer = {
	id: string;
	displayName: string | null;
	saueroCode: string | null;
};

export type FolkCompanyMappingType = FolkCompanyMapping & {
	customers?: FolkMappedCustomer[];
	proposedCustomer?: FolkMappedCustomer | null;
};

export type GetFolkMappingsResponseType = PaginatedResponseType<
	FolkCompanyMappingType[]
>;

export type FolkMappingSummaryType = Record<FolkMappingStatusEnum, number> & {
	total: number;
};

export type FolkCustomerSearchInput = {
	search?: string;
	excludeMappingId?: string;
};

export type FolkLinkCustomerInput = {
	customerId: string;
};

export type FolkSeedResultType = {
	upserted: number;
	proposed: number;
	deleted: number;
};

export type FolkFieldPreflightResultType = {
	groups: {
		groupId: string;
		label: string;
		created: string[];
		mismatches: { name: string; expected: string; actual: string }[];
		missingReadOnly: string[];
	}[];
};

export type FolkCustomerOption = {
	id: string;
	displayName: string | null;
	email: string | null;
};
