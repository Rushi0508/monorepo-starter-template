import { z } from 'zod';

export const PodLineMappingSchema = z.object({
	mappings: z
		.array(
			z.object({
				orderProductId: z
					.string()
					.describe(
						'SimplyDepo order line id (products[].id) for this OCR line'
					),
				quantity: z
					.number()
					.describe('Cases to fulfill for this line (from OCR cases)'),
			})
		)
		.min(1)
		.describe('One mapping per OCR line item that should be fulfilled'),
});

export type PodLineMappingResult = z.infer<typeof PodLineMappingSchema>;
