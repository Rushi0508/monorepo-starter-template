import type { GetUsersResponseType } from '@repo/types';
import type { ToolDef } from '../types.js';
import {
	DEFAULT_USER_LIMIT,
	type UsersInput,
	usersInputSchema,
} from './schema.js';
import { shapeUsers } from './shape.js';

export const usersTool: ToolDef = {
	name: 'get_users',
	description:
		'List Sauero platform users (id, name, email) with search and pagination. Use for who has app access. Not for customers (get_customers), orders, or OAuth client lists. Read-only; all users have full access — no roles.',
	inputSchema: usersInputSchema,
	handler: async (client, input) => {
		const parsed = input as UsersInput;
		const params: Record<string, unknown> = { ...parsed };
		if (params.limit === undefined) params.limit = DEFAULT_USER_LIMIT;

		const raw = await client.get<GetUsersResponseType>('/api/users', params);
		return shapeUsers(raw);
	},
};
