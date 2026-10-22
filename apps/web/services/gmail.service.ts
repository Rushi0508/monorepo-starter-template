import type { InboundEmailTypeEnum } from '@repo/enums';
import type {
	GmailConnectionStatusType,
	InboundEmailListResponseType,
} from '@repo/types';
import { ApiClient } from '@/lib/api-client';

export class GmailService {
	static async connect() {
		return ApiClient.get<{ url: string }>('/api/gmail/connect');
	}

	static async getStatus() {
		return ApiClient.get<GmailConnectionStatusType>('/api/gmail/status');
	}

	static async disconnect() {
		return ApiClient.delete<{ message: string }>('/api/gmail/disconnect');
	}

	static async listInboundEmails(type: InboundEmailTypeEnum) {
		return ApiClient.get<InboundEmailListResponseType>(
			`/api/gmail/inbound-emails?type=${type}`
		);
	}

	static async processInboundEmail(id: string) {
		return ApiClient.post<{ processed: boolean }>(
			`/api/gmail/inbound-emails/${id}/process`
		);
	}

	static async markInboundEmailProcessed(id: string) {
		return ApiClient.post<{ message: string }>(
			`/api/gmail/inbound-emails/${id}/mark-processed`
		);
	}

	static async deleteInboundEmail(id: string) {
		return ApiClient.delete<{ message: string }>(
			`/api/gmail/inbound-emails/${id}`
		);
	}

	static async getAttachmentBlob(id: string, attachmentId: string) {
		return ApiClient.getBlob(`/api/gmail/inbound-emails/${id}/attachment`, {
			attachmentId,
		});
	}
}
