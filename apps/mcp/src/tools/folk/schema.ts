import { FolkMappingStatusEnum } from '@repo/enums';
import { z } from 'zod';
import { paginationSchema } from '../shared/schema.js';

export const CUSTOMER_CAP = 25;

export const folkViews = [
	'mappings',
	'summary',
	'groups',
	'customers',
] as const;

export const folkInputSchema = z.object({
	view: z
		.enum(folkViews)
		.optional()
		.describe('mappings (default), summary, groups, customers'),
	search: z
		.string()
		.optional()
		.describe('Mappings: name search. Customers: at least 3 characters'),
	status: z
		.nativeEnum(FolkMappingStatusEnum)
		.optional()
		.describe('Mappings filter: PENDING_REVIEW, MAPPED, or UNMAPPED'),
	excludeMappingId: z
		.string()
		.optional()
		.describe('Customers view: skip customers already linked on this mapping'),
	...paginationSchema,
});

export type FolkInput = z.infer<typeof folkInputSchema>;
export type FolkView = (typeof folkViews)[number];
