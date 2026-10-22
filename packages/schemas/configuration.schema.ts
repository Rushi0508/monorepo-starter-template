import { z } from 'zod';
import { EmailSchema } from './common.schema';

const CommaSeparatedEmailsSchema = z
	.string()
	.trim()
	.nullable()
	.transform((value) => {
		if (!value) return null;

		const emails = value
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean);

		return emails.length > 0 ? emails.join(', ') : null;
	})
	.refine(
		(value) => {
			if (!value) return true;
			return value
				.split(',')
				.map((email) => email.trim())
				.every((email) => EmailSchema.safeParse(email).success);
		},
		{ message: 'Enter valid comma-separated emails' }
	)
	.describe('Comma-separated CC emails for distributor messages');

export const UpdateConfigurationSchema = z.object({
	d2cMaxTransitDays: z
		.number('DTC max transit days is required')
		.positive('DTC max transit days must be greater than 0'),
	b2bMaxTransitDays: z
		.number('B2B max transit days is required')
		.positive('B2B max transit days must be greater than 0'),
	mbDistributorEmail: z
		.union([EmailSchema, z.null()])
		.describe('Primary distributor email for outbound messages'),
	mbDistributorCcEmails: CommaSeparatedEmailsSchema,
});
