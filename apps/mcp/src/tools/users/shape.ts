import type { GetUsersResponseType } from '@repo/types';
import { omitNulls } from '../../lib/shape.js';

export function shapeUsers(raw: GetUsersResponseType) {
	return omitNulls({
		users: raw.data.map((u) =>
			omitNulls({
				id: u.id,
				name: u.name,
				email: u.email,
			})
		),
		totalCount: raw.totalCount,
		page: raw.page,
		limit: raw.limit,
	});
}
