import { z } from 'zod';
import { EmailSchema, StringSchema } from './common.schema';

export const CreateUserSchema = z.object({
	name: StringSchema.min(1, 'Name is required'),
	email: EmailSchema,
});
