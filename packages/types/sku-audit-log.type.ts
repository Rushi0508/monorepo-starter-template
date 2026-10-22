import { SkuSettingsAuditLog } from '@repo/db';

export type SkuAuditLogMetadata = {
	sku?: string;
	columnName?: string;
	oldValue?: string;
	newValue?: string;
};

export type SkuAuditLogEntryType = SkuSettingsAuditLog & {
	metadata: SkuAuditLogMetadata;
};

export type GetSkuAuditLogsResponseType = {
	data: SkuAuditLogEntryType[];
	totalCount: number;
};
