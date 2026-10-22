export type PaginatedResponseType<T> = {
	data: T;
	totalCount: number;
	page: number;
	limit: number;
};

export type PaginatedRequestType = {
	page?: number;
	limit?: number;
};
