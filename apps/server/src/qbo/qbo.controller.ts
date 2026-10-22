import { randomUUID } from 'node:crypto';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { config } from 'src/common/env-config';
import { QboClient } from './qbo.client';

@ApiExcludeController()
@Controller('qbo')
export class QboController {
	constructor(private readonly qboClient: QboClient) {}

	@Get('connect')
	@AllowAnonymous()
	async connect(@Res() res: Response) {
		const state = randomUUID();
		const url = await this.qboClient.getAuthorizationUrl(state);
		res.redirect(url);
	}

	@Get('callback')
	@AllowAnonymous()
	async callback(
		@Query('code') code: string,
		@Query('realmId') realmId: string,
		@Res() res: Response
	) {
		await this.qboClient.exchangeCodeForTokens(code, realmId);
		res.redirect(`${config.urls.frontend}/admin/integrations?qbo=connected`);
	}
}
