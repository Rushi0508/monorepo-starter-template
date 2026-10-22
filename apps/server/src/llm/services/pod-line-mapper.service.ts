import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Injectable, Logger } from '@nestjs/common';
import type { SimplyDepoOrderProduct } from '@repo/types';
import { generateText, Output } from 'ai';
import { config } from 'src/common/env-config';
import {
	PodLineMappingResult,
	PodLineMappingSchema,
} from '../dto/map-pod-lines.schema';
import type { PODOcrLineItem } from '../dto/pod-ocr.schema';
import { MAP_POD_LINES_PROMPT } from '../prompts/map-pod-lines';

@Injectable()
export class PodLineMapperService {
	private readonly logger = new Logger(PodLineMapperService.name);

	async mapLines(params: {
		ocrLines: PODOcrLineItem[];
		orderProducts: SimplyDepoOrderProduct[];
	}): Promise<PodLineMappingResult> {
		const google = createGoogleGenerativeAI({
			apiKey: config.google.aiApiKey,
		});

		const result = await generateText({
			model: google('gemini-3-flash-preview'),
			output: Output.object({ schema: PodLineMappingSchema }),
			reasoning: 'none',
			system: MAP_POD_LINES_PROMPT,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									ocrLines: params.ocrLines.map((line) => ({
										productName: line.productName,
										sku: line.sku,
										upc: line.upc,
										cases: line.cases,
									})),
									orderProducts: params.orderProducts.map((p) => ({
										id: p.id,
										name: p.name,
										sku: p.sku,
										barcode: p.barcode,
										quantity: p.quantity,
										totalDelivered: p.totalDelivered,
										remaining: Math.max(0, p.quantity - p.totalDelivered),
									})),
								},
								null,
								2
							),
						},
					],
				},
			],
		});

		const mapped = result.output;
		if (!mapped?.mappings?.length) {
			throw new Error('LLM returned no line mappings');
		}

		if (mapped.mappings.length !== params.ocrLines.length) {
			throw new Error(
				`LLM mapped ${mapped.mappings.length}/${params.ocrLines.length} OCR lines`
			);
		}

		const orderIds = new Set(params.orderProducts.map((p) => p.id));
		for (const row of mapped.mappings) {
			if (!orderIds.has(row.orderProductId)) {
				throw new Error(
					`LLM returned unknown orderProductId=${row.orderProductId}`
				);
			}
			if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
				throw new Error(
					`Invalid fulfill quantity for orderProductId=${row.orderProductId}`
				);
			}
		}

		this.logger.log(
			`Mapped ${mapped.mappings.length} OCR line(s) to SimplyDepo order products`
		);

		return mapped;
	}
}
