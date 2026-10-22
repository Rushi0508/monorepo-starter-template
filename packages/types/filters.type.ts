import { PaginatedRequestType } from './pagination.type';

export type UserFilterType = {
	search?: string;
} & PaginatedRequestType;
