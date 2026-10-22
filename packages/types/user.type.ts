import type { CreateUserSchema } from '@repo/schemas';
import type { z } from 'zod';
import type {
	PaginatedRequestType,
	PaginatedResponseType,
} from './pagination.type';

export interface UserListItem {
	id: string;
	name: string;
	email: string;
	createdAt: string | Date;
}

export type UserFilterType = PaginatedRequestType & {
	search?: string;
};

export type GetUsersResponseType = PaginatedResponseType<UserListItem[]>;

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
