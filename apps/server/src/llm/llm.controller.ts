import {
	BadRequestException,
	Controller,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiCookieAuth,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { POD_OCR_MIME_TYPES } from '@repo/constants';
import { CustomAuthGuard } from 'src/common/guards/custom-auth.guard';
import { PodOcrService } from './services/pod-ocr.service';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(CustomAuthGuard)
@ApiCookieAuth()
export class LlmController {
	constructor(private readonly podOcrService: PodOcrService) {}

	@Post('parse-pod')
	@ApiOperation({
		summary:
			'Parse invoice/POD image or PDF into structured data (array; one item per POD)',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
			},
			required: ['file'],
		},
	})
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: 10 * 1024 * 1024 },
		})
	)
	async parsePod(
		@UploadedFile() file: { buffer: Buffer; mimetype: string; size: number }
	) {
		if (!file) {
			throw new BadRequestException('No file uploaded');
		}

		if (!(POD_OCR_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
			throw new BadRequestException(
				`Unsupported file type: ${file.mimetype}. Accepted: ${POD_OCR_MIME_TYPES.join(', ')}`
			);
		}

		return this.podOcrService.parsePod(file.buffer, file.mimetype);
	}
}
