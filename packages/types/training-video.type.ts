import { TrainingVideo } from '@repo/db';
import type { CreateTrainingVideoSchema } from '@repo/schemas';
import type { z } from 'zod';

export type TrainingVideoType = TrainingVideo & {
	createdBy: { id: string; name: string } | null;
};

export type CreateTrainingVideoInput = z.infer<
	typeof CreateTrainingVideoSchema
>;
