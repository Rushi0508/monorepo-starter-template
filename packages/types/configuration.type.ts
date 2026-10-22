import { Configuration } from '@repo/db';
import { UpdateConfigurationSchema } from '@repo/schemas';
import { z } from 'zod';

export type ConfigurationType = Configuration;

export type UpdateConfigurationInput = z.infer<
	typeof UpdateConfigurationSchema
>;
