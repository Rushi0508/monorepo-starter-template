import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@Controller('skills')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class SkillsController {
	constructor(private readonly skillsService: SkillsService) {}

	@Get(':slug')
	@ApiOperation({
		summary: 'Download a skill folder as a zip archive',
	})
	@ApiParam({
		name: 'slug',
		description: 'Skill folder name (e.g. sauerobase)',
		example: 'sauerobase',
	})
	async downloadSkill(
		@Param('slug') slug: string,
		@Res() res: Response
	): Promise<void> {
		const buffer = await this.skillsService.buildSkillZip(slug);

		res.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${slug}.zip"`,
			'Cache-Control': 'no-store',
			'Content-Length': buffer.length,
		});
		res.send(buffer);
	}
}
