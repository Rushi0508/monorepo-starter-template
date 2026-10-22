import { InboundEmailTypeEnum } from '@repo/enums';
import type {
	GmailConnectionStatusType,
	InboundEmailListResponseType,
} from '@repo/types';
import type { ToolDef } from '../types.js';
import { type PodInput, podInputSchema } from './schema.js';
import { shapePodEmails } from './shape.js';

export const podTool: ToolDef = {
	name: 'get_pod_emails',
	description:
		'Inbound Gmail emails: proof-of-delivery (POD, default) and replenishment pickup confirmations. Returns connection status plus subject, status, and attachment metadata. Use for POD or pickup processing health. Not for folk CRM, general customer email, or sales correspondence. Does not return attachment bytes.',
	inputSchema: podInputSchema,
	handler: async (client, input) => {
		const parsed = input as PodInput;
		const includeConnection = parsed.includeConnectionStatus !== false;
		const type = parsed.type ?? InboundEmailTypeEnum.POD;

		const [emails, connection] = await Promise.all([
			client.get<InboundEmailListResponseType>('/api/gmail/inbound-emails', {
				type,
			}),
			includeConnection
				? client.get<GmailConnectionStatusType>('/api/gmail/status')
				: Promise.resolve(undefined),
		]);

		return shapePodEmails(emails, connection, type);
	},
};
