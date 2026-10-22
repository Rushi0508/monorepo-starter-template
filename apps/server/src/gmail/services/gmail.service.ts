import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import type { GmailConnectionStatusType } from '@repo/types';
import { google } from 'googleapis';
import { config } from 'src/common/env-config';
import { PrismaService } from 'src/prisma/prisma.service';

export const GMAIL_SCOPES = [
	'openid',
	'email',
	'profile',
	'https://www.googleapis.com/auth/gmail.readonly',
	'https://www.googleapis.com/auth/gmail.send',
];

export type GmailAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
};

export type SendGmailMessageInput = {
	to: string;
	cc?: string[];
	subject: string;
	text: string;
	html?: string;
	attachments?: GmailAttachment[];
};

export type SendGmailMessageResult = {
	messageId: string;
	threadId: string;
};

/** MIME lines for the message content (plain text, or multipart/alternative when HTML is present). */
function buildContentPart(input: SendGmailMessageInput): string[] {
	if (input.html) {
		const boundary = `alt_${Date.now()}`;
		return [
			`Content-Type: multipart/alternative; boundary="${boundary}"`,
			'',
			`--${boundary}`,
			'Content-Type: text/plain; charset="UTF-8"',
			'',
			input.text,
			`--${boundary}`,
			'Content-Type: text/html; charset="UTF-8"',
			'',
			input.html,
			`--${boundary}--`,
		];
	}
	return ['Content-Type: text/plain; charset="UTF-8"', '', input.text];
}

/** MIME body lines, wrapping the content in multipart/mixed when attachments are present. */
function buildMessageBody(input: SendGmailMessageInput): string[] {
	const attachments = input.attachments ?? [];
	if (attachments.length === 0) return buildContentPart(input);

	const boundary = `mixed_${Date.now()}`;
	const lines = [
		`Content-Type: multipart/mixed; boundary="${boundary}"`,
		'',
		`--${boundary}`,
		...buildContentPart(input),
	];

	for (const attachment of attachments) {
		const base64 = attachment.content
			.toString('base64')
			.replace(/(.{76})/g, '$1\r\n');
		lines.push(
			`--${boundary}`,
			`Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
			'Content-Transfer-Encoding: base64',
			`Content-Disposition: attachment; filename="${attachment.filename}"`,
			'',
			base64
		);
	}
	lines.push(`--${boundary}--`);
	return lines;
}

@Injectable()
export class GmailService {
	private readonly logger = new Logger(GmailService.name);

	constructor(private readonly prisma: PrismaService) {}

	private createOAuthClient() {
		return new google.auth.OAuth2(
			config.google.clientId,
			config.google.clientSecret,
			config.google.gmailRedirectUri
		);
	}

	getAuthorizationUrl(state: string): string {
		return this.createOAuthClient().generateAuthUrl({
			access_type: 'offline',
			// consent is required so Google re-issues refresh_token on reconnect
			prompt: 'consent',
			include_granted_scopes: true,
			scope: GMAIL_SCOPES,
			state,
		});
	}

	async exchangeCodeForTokens(
		code: string,
		connectedByUserId?: string
	): Promise<void> {
		const oauth2Client = this.createOAuthClient();
		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens.access_token || !tokens.refresh_token) {
			throw new BadRequestException(
				'Google did not return a refresh token. Disconnect the app from Google Account permissions and try again.'
			);
		}

		oauth2Client.setCredentials(tokens);

		const oauth2 = google.oauth2({
			version: 'v2',
			auth: oauth2Client as never,
		});
		const { data: profile } = await oauth2.userinfo.get();

		const googleAccountId = profile.id;
		const email = profile.email;
		if (!googleAccountId || !email) {
			throw new BadRequestException(
				'Could not resolve Google account email from OAuth response'
			);
		}

		const expiresAt = tokens.expiry_date
			? new Date(tokens.expiry_date)
			: new Date(Date.now() + 3600 * 1000);

		// Cursor only — history sync starts from connect time, no backfill
		const gmail = google.gmail({ version: 'v1', auth: oauth2Client as never });
		const { data: gmailProfile } = await gmail.users.getProfile({
			userId: 'me',
		});
		const lastHistoryId = gmailProfile.historyId?.toString() ?? null;

		await this.prisma.$transaction(async (tx) => {
			await tx.gmailConnection.deleteMany();
			await tx.gmailConnection.create({
				data: {
					googleAccountId,
					email,
					accessToken: tokens.access_token as string,
					refreshToken: tokens.refresh_token as string,
					expiresAt,
					scope: tokens.scope ?? GMAIL_SCOPES.join(' '),
					connectedByUserId: connectedByUserId ?? null,
					lastHistoryId,
				},
			});
		});

		this.logger.log(
			`Gmail connection established for ${email}, historyId=${lastHistoryId}`
		);
	}

	async getStatus(): Promise<GmailConnectionStatusType> {
		const connection = await this.prisma.gmailConnection.findFirst({
			orderBy: { createdAt: 'desc' },
		});

		if (!connection) {
			return {
				connected: false,
				email: null,
				connectedAt: null,
				googleAccountId: null,
			};
		}

		return {
			connected: true,
			email: connection.email,
			connectedAt: connection.createdAt.toISOString(),
			googleAccountId: connection.googleAccountId,
		};
	}

	async disconnect(): Promise<{ message: string }> {
		const connection = await this.prisma.gmailConnection.findFirst({
			orderBy: { createdAt: 'desc' },
		});
		if (!connection) {
			throw new NotFoundException('No Gmail connection found');
		}

		try {
			const oauth2Client = this.createOAuthClient();
			oauth2Client.setCredentials({
				access_token: connection.accessToken,
				refresh_token: connection.refreshToken,
			});
			await oauth2Client.revokeCredentials();
		} catch (err) {
			this.logger.warn(
				`Failed to revoke Google grant for ${connection.email}: ${
					err instanceof Error ? err.message : String(err)
				}`
			);
		}

		await this.prisma.gmailConnection.deleteMany();
		this.logger.log(`Gmail connection disconnected (${connection.email})`);
		return { message: 'Gmail disconnected' };
	}

	async getValidAccessToken(): Promise<string> {
		const connection = await this.prisma.gmailConnection.findFirst({
			orderBy: { createdAt: 'desc' },
		});

		if (!connection) {
			throw new NotFoundException('No Gmail connection found');
		}

		const oauth2Client = this.createOAuthClient();
		oauth2Client.setCredentials({
			access_token: connection.accessToken,
			refresh_token: connection.refreshToken,
			expiry_date: connection.expiresAt.getTime(),
		});

		const bufferMs = 5 * 60 * 1000;
		if (connection.expiresAt.getTime() - bufferMs > Date.now()) {
			return connection.accessToken;
		}

		this.logger.debug(`Refreshing Gmail token for ${connection.email}`);

		const { credentials } = await oauth2Client.refreshAccessToken();
		if (!credentials.access_token) {
			throw new BadRequestException('Failed to refresh Gmail access token');
		}

		await this.prisma.gmailConnection.update({
			where: { id: connection.id },
			data: {
				accessToken: credentials.access_token,
				expiresAt: credentials.expiry_date
					? new Date(credentials.expiry_date)
					: new Date(Date.now() + 3600 * 1000),
				...(credentials.refresh_token
					? { refreshToken: credentials.refresh_token }
					: {}),
			},
		});

		return credentials.access_token;
	}

	async getConnection() {
		return this.prisma.gmailConnection.findFirst({
			orderBy: { createdAt: 'desc' },
		});
	}

	async getGmailClient() {
		const connection = await this.getConnection();
		if (!connection) {
			throw new NotFoundException('No Gmail connection found');
		}

		const accessToken = await this.getValidAccessToken();
		const oauth2Client = this.createOAuthClient();
		oauth2Client.setCredentials({
			access_token: accessToken,
			refresh_token: connection.refreshToken,
			expiry_date: connection.expiresAt.getTime(),
		});

		return google.gmail({ version: 'v1', auth: oauth2Client as never });
	}

	async sendMessage(
		input: SendGmailMessageInput
	): Promise<SendGmailMessageResult> {
		const connection = await this.getConnection();
		if (!connection) {
			throw new NotFoundException('No Gmail connection found');
		}

		const from = connection.email;
		// Headers are ASCII-only, so the subject is RFC 2047 encoded — otherwise
		// em dashes and accented account names arrive as mojibake.
		const subject = Buffer.from(input.subject, 'utf8').toString('base64');
		const headers = [
			`From: ${from}`,
			`To: ${input.to}`,
			...(input.cc?.length ? [`Cc: ${input.cc.join(', ')}`] : []),
			`Subject: =?UTF-8?B?${subject}?=`,
			'MIME-Version: 1.0',
		];

		const body = buildMessageBody(input);
		const raw = Buffer.from([...headers, ...body].join('\r\n'))
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		const gmail = await this.getGmailClient();
		const { data } = await gmail.users.messages.send({
			userId: 'me',
			requestBody: { raw },
		});

		if (!data.id || !data.threadId) {
			throw new BadRequestException(
				'Gmail send did not return message/thread id'
			);
		}

		this.logger.log(
			`Sent Gmail message ${data.id} (thread ${data.threadId}) to ${input.to}`
		);

		return { messageId: data.id, threadId: data.threadId };
	}

	/** Fetch attachment bytes from Gmail (not stored in our DB). */
	async getAttachmentData(
		gmailMessageId: string,
		attachmentId: string
	): Promise<{ data: Buffer; size: number }> {
		const gmail = await this.getGmailClient();
		const { data } = await gmail.users.messages.attachments.get({
			userId: 'me',
			messageId: gmailMessageId,
			id: attachmentId,
		});

		if (!data.data) {
			throw new NotFoundException('Attachment data not found in Gmail');
		}

		const buffer = Buffer.from(
			data.data.replace(/-/g, '+').replace(/_/g, '/'),
			'base64'
		);

		return { data: buffer, size: data.size ?? buffer.length };
	}
}
