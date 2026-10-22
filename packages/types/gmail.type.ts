import type { InboundEmail } from '@repo/db';

export type GmailConnectionStatusType = {
	connected: boolean;
	email: string | null;
	connectedAt: string | null;
	googleAccountId: string | null;
};

export type InboundEmailType = InboundEmail;

export type InboundEmailListResponseType = {
	data: InboundEmailType[];
	totalCount: number;
};
