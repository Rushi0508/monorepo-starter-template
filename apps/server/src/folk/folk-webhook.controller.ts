import {
	Body,
	Controller,
	Headers,
	HttpCode,
	Post,
	type RawBodyRequest,
	Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import { FolkWebhookService } from './services/folk-webhook.service';

@AllowAnonymous()
@ApiExcludeController()
@Controller('folk/webhooks')
export class FolkWebhookController {
	constructor(private readonly webhookService: FolkWebhookService) {}

	@Post()
	@HttpCode(200)
	handle(
		@Req() req: RawBodyRequest<Request>,
		@Headers('webhook-id') webhookId: string | undefined,
		@Headers('webhook-timestamp') webhookTimestamp: string | undefined,
		@Headers('webhook-signature') webhookSignature: string | undefined,
		@Body()
		body: {
			id: string;
			type: string;
			data: {
				id: string;
				changes?: {
					path: string[];
					type: 'add' | 'remove' | 'set';
					value?: unknown;
				}[];
			};
		}
	) {
		this.webhookService.verifyOrThrow({
			rawBody: req.rawBody,
			webhookId,
			webhookTimestamp,
			webhookSignature,
		});

		void this.webhookService.ingest(body).catch((err: Error) => {
			console.error(`Folk webhook ${body.id} failed: ${err.message}`);
		});

		return { received: true };
	}
}
