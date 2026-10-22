import type {
	GetSkuAuditLogsResponseType,
	GetSkuSettingsResponseType,
	SkuCheckResult,
} from '@repo/types';
import { capWithMeta, omitNulls, pageWithMeta } from '../../lib/shape.js';
import { AUDIT_LOG_CAP, SKU_LIST_CAP } from './schema.js';

export function shapeSkuList(
	raw: GetSkuSettingsResponseType,
	opts: { page?: number; limit?: number } = {}
) {
	const rows = raw.data.map((s) =>
		omitNulls({
			sku: s.sku,
			title: s.title?.trim() || s.sku,
			channels: s.channels,
		})
	);
	const paged = pageWithMeta(rows, opts.page ?? 1, opts.limit ?? SKU_LIST_CAP);

	return omitNulls({
		skus: paged.items,
		totalCount: paged.totalCount,
		page: paged.page,
		limit: paged.limit,
		truncated: paged.truncated,
	});
}

export function shapeSkuDetail(
	raw: GetSkuSettingsResponseType,
	sku: string,
	check?: SkuCheckResult
) {
	const match = raw.data.find((s) => s.sku.toLowerCase() === sku.toLowerCase());
	if (!match) {
		return omitNulls({
			sku,
			found: false,
			check,
		});
	}

	const customFields =
		match.customFields &&
		typeof match.customFields === 'object' &&
		!Array.isArray(match.customFields)
			? (match.customFields as Record<string, string>)
			: {};

	return omitNulls({
		sku: match.sku,
		title: match.title?.trim() || match.sku,
		channels: match.channels,
		customFields:
			Object.keys(customFields).length > 0 ? customFields : undefined,
		columns: raw.columns.map((c) =>
			omitNulls({ id: c.id, name: c.name, position: c.position })
		),
		check,
	});
}

export function shapeAuditLogs(
	raw: GetSkuAuditLogsResponseType
): Record<string, unknown> {
	const capped = capWithMeta(raw.data, AUDIT_LOG_CAP);
	return omitNulls({
		auditLogs: capped.items.map((e) =>
			omitNulls({
				activity: e.activity,
				createdAt: e.createdAt,
				metadata: e.metadata as Record<string, unknown> | undefined,
			})
		),
		totalCount: raw.totalCount,
		truncated: capped.truncated,
	});
}
