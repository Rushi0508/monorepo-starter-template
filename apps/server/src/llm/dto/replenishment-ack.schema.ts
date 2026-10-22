import { z } from 'zod';

export const ReplenishmentAckClassificationSchema = z.object({
	isAcknowledgement: z
		.boolean()
		.describe(
			'True only if the reply confirms receipt/ack of the replenishment order or quantities'
		),
	reason: z
		.string()
		.describe('Short explanation for the classification decision'),
});

export type ReplenishmentAckClassification = z.infer<
	typeof ReplenishmentAckClassificationSchema
>;
