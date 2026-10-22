import type {
	GmailConnectionStatusType,
	InboundEmailListResponseType,
} from '@repo/types';
import { capWithMeta, omitNulls } from '../../lib/shape.js';
import { POD_EMAIL_CAP } from './schema.js';

export function shapePodEmails(
	raw: InboundEmailListResponseType,
	connection?: GmailConnectionStatusType,
	type?: string
) {
	const capped = capWithMeta(raw.data, POD_EMAIL_CAP);

	return omitNulls({
		type,
		connection: connection
			? omitNulls({
					connected: connection.connected,
					email: connection.email,
					connectedAt: connection.connectedAt,
				})
			: undefined,
		emails: capped.items.map((e) =>
			omitNulls({
				id: e.id,
				from: e.from,
				subject: e.subject,
				snippet: e.snippet,
				receivedAt: e.receivedAt,
				status: e.status,
				attachmentCount: e.filenames?.length ?? e.attachmentIds?.length ?? 0,
				filenames: e.filenames,
			})
		),
		totalCount: raw.totalCount,
		truncated: capped.truncated,
	});
}
