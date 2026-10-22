import { CreateUserSchema } from '@repo/schemas';
import { z } from 'zod';
import { PaginatedResponseType } from './pagination.type';

export interface UserListItem {
	id: string;
	name: string;
	email: string;
}

export type GetUsersResponseType = PaginatedResponseType<UserListItem[]>;

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
