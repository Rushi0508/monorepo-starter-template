import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Injectable, Logger } from '@nestjs/common';
import { generateText, Output } from 'ai';
import { config } from 'src/common/env-config';
import {
	type ReplenishmentAckClassification,
	ReplenishmentAckClassificationSchema,
} from '../dto/replenishment-ack.schema';
import { REPLENISHMENT_ACK_PROMPT } from '../prompts/replenishment-ack';

@Injectable()
export class ReplenishmentAckClassifierService {
	private readonly logger = new Logger(ReplenishmentAckClassifierService.name);

	async classify(params: {
		orderNumber: string;
		subject: string | null;
		body: string;
		items: { sku: string; quantity: number }[];
	}): Promise<ReplenishmentAckClassification> {
		const google = createGoogleGenerativeAI({
			apiKey: config.google.aiApiKey,
		});

		const result = await generateText({
			model: google('gemini-3-flash-preview'),
			output: Output.object({ schema: ReplenishmentAckClassificationSchema }),
			reasoning: 'none',
			system: REPLENISHMENT_ACK_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									orderNumber: params.orderNumber,
									items: params.items,
									replySubject: params.subject,
									replyBody: params.body.slice(0, 8000),
								},
								null,
								2
							),
						},
					],
				},
			],
		});

		const output = result.output;
		if (!output) {
			throw new Error('LLM returned no acknowledgement classification');
		}

		this.logger.debug(
			`Ack classify ${params.orderNumber}: isAcknowledgement=${output.isAcknowledgement} (${output.reason})`
		);

		return output;
	}
}
