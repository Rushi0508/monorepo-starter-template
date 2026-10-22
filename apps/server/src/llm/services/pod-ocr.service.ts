import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { config } from 'src/common/env-config';
import { PODOcrBatchResult, PODOcrSchema } from '../dto/pod-ocr.schema';
import { POD_PROMPT } from '../prompts/pod';

@Injectable()
export class PodOcrService {
	private readonly logger = new Logger(PodOcrService.name);

	async parsePod(
		fileBuffer: Buffer,
		mediaType: string
	): Promise<PODOcrBatchResult> {
		const google = createGoogleGenerativeAI({
			apiKey: config.google.aiApiKey,
		});

		const result = await generateText({
			model: google('gemini-3-flash-preview'),
			output: Output.array({ element: PODOcrSchema }),
			reasoning: 'none',
			system: POD_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Extract all proof of delivery data from this document. If the file contains multiple distinct PODs or invoices, return one array item per document.',
						},
						{
							type: 'image',
							image: fileBuffer,
							mediaType,
						},
					],
				},
			],
		});

		const documents = result.output;
		if (!documents?.length) {
			throw new Error('Failed to extract structured data from the document');
		}

		this.logger.log(
			`Parsed ${documents.length} proof of delivery document(s): ${documents
				.map(
					(d) =>
						`#${d.invoiceNumber ?? 'unknown'} (${d.lineItems.length} line items)`
				)
				.join(', ')}`
		);

		return documents;
	}
}
