import { z } from 'zod';
import { paginationSchema } from '../shared/schema.js';

export const DEFAULT_USER_LIMIT = 10;

export const usersInputSchema = z.object({
	search: z.string().optional().describe('Search name or email'),
	...paginationSchema,
});

export type UsersInput = z.infer<typeof usersInputSchema>;
