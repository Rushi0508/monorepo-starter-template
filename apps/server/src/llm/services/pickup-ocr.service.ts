import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Injectable } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { config } from 'src/common/env-config';
import { PickupOcrSchema } from '../dto/pickup-ocr.schema';
import { PICKUP_PROMPT } from '../prompts/pickup';

@Injectable()
export class PickupOcrService {
	/** OCR a pickup document (Bill of Lading) for its MB-#### order numbers. */
	async extractOrderNumbers(
		fileBuffer: Buffer,
		mediaType: string
	): Promise<string[]> {
		const google = createGoogleGenerativeAI({
			apiKey: config.google.aiApiKey,
		});

		const result = await generateText({
			model: google('gemini-3-flash-preview'),
			output: Output.object({ schema: PickupOcrSchema }),
			reasoning: 'none',
			system: PICKUP_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Extract the Sauero order number(s) from this pickup document.',
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

		return (result.output?.orderNumbers ?? [])
			.map((n) => n.trim().toUpperCase())
			.filter(Boolean);
	}
}
