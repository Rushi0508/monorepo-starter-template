import { randomUUID } from 'node:crypto';
import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Post,
	Query,
	Res,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { InboundEmailType } from '@repo/db';
import {
	AllowAnonymous,
	Session,
	type UserSession,
} from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { config } from 'src/common/env-config';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { GmailService } from './services/gmail.service';
import { InboundEmailService } from './services/inbound-email.service';
import { PickupEmailProcessService } from './services/pickup-email-process.service';
import { PodEmailProcessService } from './services/pod-email-process.service';

@ApiTags('Gmail')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
@Controller('gmail')
export class GmailController {
	constructor(
		private readonly gmailService: GmailService,
		private readonly inboundEmailService: InboundEmailService,
		private readonly podEmailProcessService: PodEmailProcessService,
		private readonly pickupEmailProcessService: PickupEmailProcessService
	) {}

	@Get('connect')
	@ApiOperation({ summary: 'Start Google OAuth for Gmail readonly access' })
	connect() {
		const state = randomUUID();
		return { url: this.gmailService.getAuthorizationUrl(state) };
	}

	@Get('callback')
	@AllowAnonymous()
	@ApiOperation({ summary: 'Google OAuth callback for Gmail connection' })
	async callback(
		@Query('code') code: string,
		@Query('error') error: string | undefined,
		@Res() res: Response,
		@Session() session?: UserSession
	) {
		if (error || !code) {
			const reason = error ?? 'missing_code';
			return res.redirect(
				`${config.urls.frontend}/configuration?gmail=error&reason=${encodeURIComponent(reason)}`
			);
		}

		try {
			await this.gmailService.exchangeCodeForTokens(code, session?.user?.id);
			return res.redirect(
				`${config.urls.frontend}/configuration?gmail=connected`
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'gmail_connect_failed';
			return res.redirect(
				`${config.urls.frontend}/configuration?gmail=error&reason=${encodeURIComponent(message)}`
			);
		}
	}

	@Get('status')
	@ApiOperation({ summary: 'Get current Gmail connection status' })
	getStatus() {
		return this.gmailService.getStatus();
	}

	@Delete('disconnect')
	@ApiOperation({ summary: 'Disconnect the org Gmail account' })
	disconnect() {
		return this.gmailService.disconnect();
	}

	@Get('inbound-emails')
	@ApiOperation({ summary: 'List emails ingested from the Gmail inbox' })
	@ApiQuery({ name: 'type', enum: InboundEmailType, required: false })
	listInboundEmails(@Query('type') type?: InboundEmailType) {
		if (type && !Object.values(InboundEmailType).includes(type)) {
			throw new BadRequestException(
				`type must be one of ${Object.values(InboundEmailType).join(', ')}`
			);
		}
		return this.inboundEmailService.list(type);
	}

	@Post('inbound-emails/:id/process')
	@ApiOperation({
		summary:
			'Process an inbound email — POD: OCR + SimplyDepo fulfillment; pickup: OCR + replenishment pickup confirmation (marks PROCESSED only if all succeed)',
	})
	async processInboundEmail(@Param('id') id: string) {
		const email = await this.inboundEmailService.get(id);
		return email.type === InboundEmailType.PICKUP
			? this.pickupEmailProcessService.processPickupEmail(id)
			: this.podEmailProcessService.processPodEmail(id);
	}

	@Post('inbound-emails/:id/mark-processed')
	@ApiOperation({
		summary: 'Mark an inbound email as PROCESSED without running OCR',
	})
	markInboundEmailProcessed(@Param('id') id: string) {
		return this.inboundEmailService.markAsProcessed(id);
	}

	@Delete('inbound-emails/:id')
	@ApiOperation({ summary: 'Delete an ingested inbound email' })
	deleteInboundEmail(@Param('id') id: string) {
		return this.inboundEmailService.delete(id);
	}

	@Get('inbound-emails/:id/attachment')
	@ApiOperation({
		summary:
			'Stream an inbound email attachment from Gmail by attachmentId (on-demand, not stored locally)',
	})
	async getInboundEmailAttachment(
		@Param('id') id: string,
		@Query('attachmentId') attachmentId: string,
		@Res() res: Response
	) {
		if (!attachmentId) {
			throw new BadRequestException('attachmentId query param is required');
		}

		const email = await this.inboundEmailService.get(id);

		const index = email.attachmentIds.indexOf(attachmentId);
		if (index === -1) {
			throw new NotFoundException('Attachment not found on this email');
		}

		const { data } = await this.gmailService.getAttachmentData(
			email.gmailMessageId,
			attachmentId
		);

		const filename = email.filenames[index] ?? 'attachment';
		const mimeType = email.mimeTypes[index] ?? 'application/octet-stream';
		res.setHeader('Content-Type', mimeType);
		res.setHeader(
			'Content-Disposition',
			`inline; filename="${filename.replace(/"/g, '')}"`
		);
		res.setHeader('Content-Length', data.length);
		return res.send(data);
	}
}
