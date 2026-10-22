import { z } from 'zod';
import { StringSchema } from './common.schema';

export const CreateTrainingVideoSchema = z.object({
	title: StringSchema.min(1, 'Title is required').max(200),
	description: StringSchema.max(2000).optional(),
	url: StringSchema.min(1, 'Video link is required').pipe(
		z.url('Enter a valid link')
	),
});
